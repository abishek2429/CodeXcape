const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const levelRepository = require('../repositories/levelRepository');
const questionRepository = require('../repositories/questionRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../repositories/teamStageProgressRepository');
const answerAttemptRepository = require('../repositories/answerAttemptRepository');
const scoringService = require('./scoringService');
const auditService = require('./auditService');
const webSocketService = require('./webSocketService');
const { withTransaction } = require('../config/db');
const {
  ResourceNotFoundException,
  EventUnavailableException,
  InvalidLevelTransitionException
} = require('../middleware/errorHandler');

class QuestionAnswerService {
  getTotalStages(levelNumber) {
    return (levelNumber >= 4) ? 3 : 2;
  }

  async findCurrentStage(teamId, levelId, levelNumber, client = null) {
    const totalStages = this.getTotalStages(levelNumber);
    const progressList = await teamStageProgressRepository.findByTeamIdAndLevelIdOrderByStageNumberAsc(teamId, levelId, client);

    for (let s = 1; s <= totalStages; s++) {
      const sp = progressList.find(p => p.stageNumber === s);
      if (!sp || !sp.player1Completed || !sp.player2Completed) {
        return s;
      }
    }
    return totalStages;
  }

  async enforceDeadline(team) {
    const serverTime = Date.now();
    let totalStoryPause = team.totalStoryPauseSeconds || 0;
    if (team.currentStoryKey && team.storyPausedAt) {
      totalStoryPause += Math.max(0, Math.floor((serverTime - new Date(team.storyPausedAt).getTime()) / 1000));
    }


    if (team.startedAt) {
      const deadline = new Date(team.startedAt).getTime() + (100 * 60 + totalStoryPause) * 1000;
      if (serverTime > deadline) {
        throw new EventUnavailableException('The 100-minute game window has ended. Time expired.');
      }
    }
  }

  canonicalizeAnswer(raw) {
    if (!raw) return '';
    return raw.toUpperCase().replace(/[:/\-_ \t\r\n]+/g, '').trim();
  }

  normalizeAndValidate(submitted, expected, answerType) {
    if (!submitted || !expected) return false;

    const normSubmitted = submitted.trim();
    const normExpected = expected.trim();

    if (answerType === 'NUMERIC') {
      const numSub = normSubmitted.replace(/[\s,]/g, '');
      const numExp = normExpected.replace(/[\s,]/g, '');
      if (numSub === numExp) return true;
    }

    if (normSubmitted.toLowerCase() === normExpected.toLowerCase()) {
      return true;
    }

    const canonicalSubmitted = this.canonicalizeAnswer(normSubmitted);
    const canonicalExpected = this.canonicalizeAnswer(normExpected);
    if (canonicalSubmitted && canonicalSubmitted === canonicalExpected) {
      return true;
    }

    // Single letter multiple choice (e.g. 'A' vs 'OPTION A')
    if (normExpected.length === 1 && /[A-Za-z]/.test(normExpected)) {
      const expChar = normExpected.toUpperCase();
      if (canonicalSubmitted === expChar ||
          canonicalSubmitted === `OPTION${expChar}` ||
          canonicalSubmitted === `CHOICE${expChar}`) {
        return true;
      }
    }

    // Heuristics matching Java QuestionAnswerService
    if (canonicalExpected.includes('48') && canonicalExpected.includes('34')) {
      if (canonicalSubmitted.includes('48') && canonicalSubmitted.includes('34')) return true;
    }
    if (canonicalExpected === '478958' && canonicalSubmitted === '478958') return true;
    if (canonicalExpected === '758' && canonicalSubmitted === '758') return true;
    if ((canonicalExpected === 'HEKKO' || canonicalExpected === 'HELLO') &&
        (canonicalSubmitted === 'HEKKO' || canonicalSubmitted === 'HELLO')) return true;
    if (canonicalExpected === 'CCX' && canonicalSubmitted === 'CCX') return true;
    if ((canonicalExpected === 'A' || canonicalExpected.includes('30008080')) &&
        (canonicalSubmitted === 'A' || canonicalSubmitted.includes('30008080') || canonicalSubmitted.includes('3000:8080'))) return true;
    if ((canonicalExpected.includes('CHITRA') || canonicalExpected.includes('ASHA')) &&
        (canonicalSubmitted.includes('CHITRA') || canonicalSubmitted.includes('ASHA'))) return true;

    return false;
  }

  async getCurrentQuestionForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const event = team.event;
    await this.enforceDeadline(team);

    if (event.status !== 'RUNNING' && event.status !== 'READY') {
      throw new EventUnavailableException('The event is not currently active.');
    }
    if (team.gameState === 'NOT_STARTED') {
      throw new EventUnavailableException('The event has not been started by your team yet. Please enter the team lobby.');
    }
    if (team.gameState === 'FINAL_PASSKEY') {
      throw new EventUnavailableException('All 6 levels completed. Master terminal override active. Proceed to the final passkey terminal.');
    }
    if (team.gameState === 'COMPLETED') {
      throw new EventUnavailableException('CodeXcape has already been completed by your team.');
    }

    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    let activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );
    if (!activeProgress) {
      const completedCount = progressList.filter(p => p.levelStatus === 'COMPLETED').length;
      if (completedCount >= 6 || team.gameState === 'FINAL_PASSKEY' || team.gameState === 'COMPLETED') {
        return null;
      }

      // Auto-recovery: If previous level was completed but next level remained locked, unlock next level
      const lastCompleted = progressList.filter(p => p.levelStatus === 'COMPLETED').pop();
      if (lastCompleted) {
        const lastLvl = await levelRepository.findById(lastCompleted.levelId);
        const lastLvlNum = lastLvl ? lastLvl.levelNumber : (lastCompleted.level ? lastCompleted.level.levelNumber : null);
        if (lastLvlNum && lastLvlNum < 6) {
          const nextLevel = await levelRepository.findByLevelNumber(lastLvlNum + 1);
          if (nextLevel) {
            let nextProgress = await teamLevelProgressRepository.findByTeamIdAndLevelId(team.id, nextLevel.id);
            if (nextProgress) {
              nextProgress.levelStatus = 'AVAILABLE';
              nextProgress.startedAt = nextProgress.startedAt || new Date().toISOString();
              await teamLevelProgressRepository.save(nextProgress);
              activeProgress = nextProgress;
            }
          }
        }
      }

      if (!activeProgress) {
        throw new InvalidLevelTransitionException('No active level available for current game state.');
      }
    }

    const level = await levelRepository.findById(activeProgress.levelId);
    const currentStage = await this.findCurrentStage(team.id, level.id, level.levelNumber);
    const totalStages = this.getTotalStages(level.levelNumber);

    const question = await questionRepository.findByLevelIdAndStageNumberAndPlayerNumber(
      level.id,
      currentStage,
      principal.playerNumber
    );
    if (!question) {
      throw new ResourceNotFoundException(`Question not found for Level ${level.levelNumber}, Stage ${currentStage} and Player ${principal.playerNumber}`);
    }

    const isCompleted = await answerAttemptRepository.existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
      team.id,
      principal.playerId,
      level.id,
      question.id
    );

    const attemptCount = await answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
      team.id,
      principal.playerId,
      level.id,
      question.id
    );

    return {
      levelNumber: level.levelNumber,
      stageNumber: currentStage,
      totalStages,
      questionId: question.id,
      puzzleContext: question.puzzleContext,
      evidence: question.evidence,
      instructions: question.instructions,
      puzzleMetadata: question.puzzleMetadata,
      answerType: question.answerType,
      isCompleted,
      attemptCount,
      stateVersion: team.stateVersion || 1
    };
  }

  async submitAnswer(principal, request) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');

    const txResult = await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(principal.teamId, client);
      if (!team) throw new ResourceNotFoundException('Team not found.');

      await this.enforceDeadline(team);

      if (team.gameState === 'NOT_STARTED') {
        throw new EventUnavailableException('The event has not been started by your team yet. Please enter the team lobby.');
      }
      if (team.gameState === 'FINAL_PASSKEY') {
        throw new EventUnavailableException('All 6 levels completed. Master terminal override active. Please submit the final passkey at the final terminal.');
      }
      if (team.gameState === 'COMPLETED') {
        throw new EventUnavailableException('CodeXcape has already been completed by your team.');
      }

      const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id, client);
      const activeProgress = progressList.find(
        p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
      );
      if (!activeProgress) {
        throw new InvalidLevelTransitionException('No active level available for answer submission.');
      }

      const level = await levelRepository.findById(activeProgress.levelId, client);
      if (request.levelNumber != null && parseInt(request.levelNumber, 10) !== level.levelNumber) {
        const completedLvl = progressList.find(
          p => p.level.levelNumber === parseInt(request.levelNumber, 10) && p.levelStatus === 'COMPLETED'
        );
        if (completedLvl) {
          return {
            earlyReturn: true,
            response: {
              correct: true,
              isCorrect: true,
              status: 'CORRECT',
              isCompleted: true,
              stageCompleted: true,
              levelCompleted: true,
              stageNumber: null,
              nextStageNumber: null,
              currentLevel: level.levelNumber,
              finalScore: team.finalScore || 0,
              baseScore: team.baseScore || 0,
              stateVersion: team.stateVersion || 1,
              message: 'Level completed. Both players solved the final stage.'
            }
          };
        }
        throw new InvalidLevelTransitionException(`Submitted level number does not match current active level ${level.levelNumber}.`);
      }

      const currentStage = await this.findCurrentStage(team.id, level.id, level.levelNumber, client);
      const totalStages = this.getTotalStages(level.levelNumber);

      // Idempotency: if request specifies a stageNumber that has already been completed for this level
      if (request.stageNumber != null && parseInt(request.stageNumber, 10) < currentStage) {
        return {
          earlyReturn: true,
          response: {
            correct: true,
            isCorrect: true,
            status: 'CORRECT',
            isCompleted: true,
            stageCompleted: true,
            levelCompleted: false,
            stageNumber: parseInt(request.stageNumber, 10),
            nextStageNumber: currentStage,
            currentLevel: level.levelNumber,
            finalScore: team.finalScore || 0,
            baseScore: team.baseScore || 0,
            stateVersion: team.stateVersion || 1,
            message: 'Stage already completed.'
          }
        };
      }

      const question = await questionRepository.findByLevelIdAndStageNumberAndPlayerNumber(
        level.id,
        currentStage,
        principal.playerNumber,
        client
      );
      if (!question) {
        throw new ResourceNotFoundException(`Question not found for Level ${level.levelNumber}, Stage ${currentStage}`);
      }

      let stageProgress = await teamStageProgressRepository.findForUpdate(
        team.id,
        level.id,
        currentStage,
        client
      );
      if (!stageProgress) {
        stageProgress = await teamStageProgressRepository.save({
          teamId: team.id,
          levelId: level.id,
          stageNumber: currentStage,
          player1Completed: false,
          player2Completed: false,
          discoveryKey: `DISCOVERY-L${level.levelNumber}-S${currentStage}`
        }, client);
      }

      const playerAlreadyCompleted = (principal.playerNumber === 1 && stageProgress.player1Completed) ||
                                     (principal.playerNumber === 2 && stageProgress.player2Completed);
      const bothCompleted = Boolean(stageProgress.player1Completed && stageProgress.player2Completed);

      if (playerAlreadyCompleted || bothCompleted || activeProgress.levelStatus === 'COMPLETED') {
        const finalStage = currentStage >= totalStages;
        const isLevelCompleted = activeProgress.levelStatus === 'COMPLETED' || (bothCompleted && finalStage);
        return {
          earlyReturn: true,
          response: {
            correct: true,
            isCorrect: true,
            status: 'CORRECT',
            isCompleted: true,
            stageCompleted: bothCompleted,
            levelCompleted: isLevelCompleted,
            stageNumber: currentStage,
            nextStageNumber: bothCompleted && !finalStage ? currentStage + 1 : null,
            currentLevel: isLevelCompleted ? Math.min(6, level.levelNumber + 1) : level.levelNumber,
            finalScore: team.finalScore || 0,
            baseScore: team.baseScore || 0,
            stateVersion: team.stateVersion || 1,
            message: bothCompleted
              ? (isLevelCompleted
                  ? 'Level completed. Both players solved the final stage.'
                  : 'Stage completed. The next cooperative stage is now available.')
              : 'ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.'
          }
        };
      }

      // Check Answer
      const submittedRaw = request.answer ? request.answer.trim() : '';
      const isCorrect = this.normalizeAndValidate(submittedRaw, question.expectedAnswerHash, question.answerType);

      const previousAttempts = await answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
        team.id,
        principal.playerId,
        level.id,
        question.id,
        client
      );
      const attemptNumber = previousAttempts + 1;

      const recordedAttempt = await answerAttemptRepository.recordAttempt({
        teamId: team.id,
        playerId: principal.playerId,
        levelId: level.id,
        questionId: question.id,
        attemptNumber,
        submittedAnswer: submittedRaw,
        interactionPayload: request.interactionPayload ? JSON.stringify(request.interactionPayload) : null,
        isCorrect
      }, client);

      if (!isCorrect) {
        await scoringService.recordWrongAttempt(team.id, principal.playerId, level.levelNumber, currentStage, recordedAttempt.id, client);
        await auditService.logEvent(
          'ANSWER_WRONG',
          team.event,
          team,
          { id: principal.playerId },
          { levelNumber: level.levelNumber, stageNumber: currentStage, attemptNumber },
          'PLAYER',
          client
        );
        return {
          earlyReturn: true,
          response: {
            correct: false,
            isCorrect: false,
            status: 'INCORRECT',
            isCompleted: false,
            stageCompleted: false,
            levelCompleted: false,
            stageNumber: currentStage,
            nextStageNumber: null,
            currentLevel: level.levelNumber,
            finalScore: team.finalScore || 0,
            baseScore: team.baseScore || 0,
            stateVersion: team.stateVersion || 1,
            message: 'INCORRECT ANSWER. ANALYZE SYSTEM TELEMETRY AND RE-ENGAGE.'
          }
        };
      }

      // Answer is Correct!
      await auditService.logEvent(
        'ANSWER_CORRECT',
        team.event,
        team,
        { id: principal.playerId },
        { levelNumber: level.levelNumber, stageNumber: currentStage, attemptNumber },
        'PLAYER',
        client
      );

      if (principal.playerNumber === 1) {
        stageProgress.player1Completed = true;
      } else {
        stageProgress.player2Completed = true;
      }

      const stageFinished = Boolean(stageProgress.player1Completed && stageProgress.player2Completed);
      const isFinalStage = Boolean(stageFinished && (currentStage >= totalStages));

      if (stageFinished) {
        stageProgress.completedAt = new Date().toISOString();
        await teamStageProgressRepository.save(stageProgress, client);
        const updatedTeam = await scoringService.recordMiniGameCompletion(team.id, level.levelNumber, currentStage, client);
        if (updatedTeam) {
          team.baseScore = updatedTeam.baseScore;
          team.finalScore = updatedTeam.finalScore;
          team.completedMiniGames = updatedTeam.completedMiniGames;
        }

        team.stateVersion = (team.stateVersion || 1) + 1;
        await teamRepository.save(team, client);
      } else {
        await teamStageProgressRepository.save(stageProgress, client);
        team.stateVersion = (team.stateVersion || 1) + 1;
        await teamRepository.save(team, client);
      }

      return {
        earlyReturn: false,
        team,
        level,
        currentStage,
        totalStages,
        stageFinished,
        isFinalStage
      };
    });

    if (txResult.earlyReturn) {
      return txResult.response;
    }

    const { team, level, currentStage, stageFinished, isFinalStage } = txResult;

    // Broadcast challenge completed notification
    webSocketService.broadcastToTeam(team.id, {
      type: 'PARTNER_CHALLENGE_COMPLETED',
      teamId: team.id,
      playerId: principal.playerId,
      playerNumber: principal.playerNumber,
      levelNumber: level.levelNumber,
      stageNumber: currentStage,
      stateVersion: team.stateVersion,
      message: `${principal.displayName} verified stage telemetry ✓`,
      timestamp: new Date().toISOString()
    });

    if (stageFinished && !isFinalStage) {
      webSocketService.broadcastToTeam(team.id, {
        type: 'STAGE_COMPLETED',
        teamId: team.id,
        levelNumber: level.levelNumber,
        stageNumber: currentStage,
        nextStageNumber: currentStage + 1,
        stateVersion: team.stateVersion,
        message: `Level ${level.levelNumber} Stage ${currentStage} completed!`,
        timestamp: new Date().toISOString()
      });
    }

    let finalTeam = team;
    if (stageFinished && isFinalStage) {
      const gameStateService = require('./gameStateService');
      const lvlTeam = await gameStateService.completeLevel(team.id, level.levelNumber);
      if (lvlTeam) {
        finalTeam = lvlTeam;
      }
    }

    return {
      correct: true,
      isCorrect: true,
      status: 'CORRECT',
      isCompleted: true,
      stageCompleted: stageFinished,
      levelCompleted: isFinalStage,
      stageNumber: currentStage,
      nextStageNumber: stageFinished ? (isFinalStage ? null : currentStage + 1) : null,
      currentLevel: isFinalStage ? Math.min(6, level.levelNumber + 1) : level.levelNumber,
      finalScore: finalTeam.finalScore || 0,
      baseScore: finalTeam.baseScore || 0,
      stateVersion: finalTeam.stateVersion || 1,
      message: stageFinished
        ? (isFinalStage
            ? 'Level completed. Both players solved the final stage.'
            : 'Stage completed. The next cooperative stage is now available.')
        : 'ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.'
    };
  }
}

module.exports = new QuestionAnswerService();
