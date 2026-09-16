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

  async findCurrentStage(teamId, levelId, levelNumber) {
    const totalStages = this.getTotalStages(levelNumber);
    const progressList = await teamStageProgressRepository.findByTeamIdAndLevelIdOrderByStageNumberAsc(teamId, levelId);

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
    const activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );
    if (!activeProgress) {
      throw new InvalidLevelTransitionException('No active level available for current game state.');
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
      attemptCount
    };
  }

  async submitAnswer(principal, request) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
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

    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    const activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );
    if (!activeProgress) {
      throw new InvalidLevelTransitionException('No active level available for answer submission.');
    }

    const level = await levelRepository.findById(activeProgress.levelId);
    if (request.levelNumber != null && parseInt(request.levelNumber, 10) !== level.levelNumber) {
      const completedLvl = progressList.find(
        p => p.level.levelNumber === parseInt(request.levelNumber, 10) && p.levelStatus === 'COMPLETED'
      );
      if (completedLvl) {
        return {
          correct: true,
          isCompleted: true,
          stageCompleted: true,
          message: 'Level completed. Both players solved the final stage.'
        };
      }
      throw new InvalidLevelTransitionException(`Submitted level number does not match current active level ${level.levelNumber}.`);
    }

    const currentStage = await this.findCurrentStage(team.id, level.id, level.levelNumber);
    const totalStages = this.getTotalStages(level.levelNumber);

    const question = await questionRepository.findByLevelIdAndStageNumberAndPlayerNumber(
      level.id,
      currentStage,
      principal.playerNumber
    );
    if (!question) {
      throw new ResourceNotFoundException(`Question not found for Level ${level.levelNumber}, Stage ${currentStage}`);
    }

    let stageProgress = await teamStageProgressRepository.findByTeamIdAndLevelIdAndStageNumber(
      team.id,
      level.id,
      currentStage
    );
    if (!stageProgress) {
      stageProgress = await teamStageProgressRepository.save({
        teamId: team.id,
        levelId: level.id,
        stageNumber: currentStage,
        player1Completed: false,
        player2Completed: false,
        discoveryKey: `DISCOVERY-L${level.levelNumber}-S${currentStage}`
      });
    }

    const playerAlreadyCompleted = (principal.playerNumber === 1 && stageProgress.player1Completed) ||
                                   (principal.playerNumber === 2 && stageProgress.player2Completed);
    const bothCompleted = Boolean(stageProgress.player1Completed && stageProgress.player2Completed);

    if (playerAlreadyCompleted || bothCompleted || activeProgress.levelStatus === 'COMPLETED') {
      const finalStage = currentStage >= totalStages;
      const isLevelCompleted = activeProgress.levelStatus === 'COMPLETED' || (bothCompleted && finalStage);
      return {
        correct: true,
        isCompleted: true,
        stageCompleted: bothCompleted,
        stageNumber: currentStage,
        nextStageNumber: bothCompleted && !finalStage ? currentStage + 1 : null,
        message: bothCompleted
          ? (isLevelCompleted
              ? 'Level completed. Both players solved the final stage.'
              : 'Stage completed. The next cooperative stage is now available.')
          : 'ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.'
      };
    }

    // Check Answer
    const submittedRaw = request.answer ? request.answer.trim() : '';
    const isCorrect = this.normalizeAndValidate(submittedRaw, question.expectedAnswerHash, question.answerType);

    const previousAttempts = await answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
      team.id,
      principal.playerId,
      level.id,
      question.id
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
    });

    if (!isCorrect) {
      await scoringService.recordWrongAttempt(team.id, principal.playerId, level.levelNumber, currentStage, recordedAttempt.id);
      await auditService.logEvent(
        'ANSWER_WRONG',
        team.event,
        team,
        { id: principal.playerId },
        { levelNumber: level.levelNumber, stageNumber: currentStage, attemptNumber },
        'PLAYER'
      );
      return {
        correct: false,
        isCorrect: false,
        status: 'INCORRECT',
        isCompleted: false,
        stageCompleted: false,
        message: 'INCORRECT ANSWER. ANALYZE SYSTEM TELEMETRY AND RE-ENGAGE.'
      };
    }

    // Is Correct!
    await auditService.logEvent(
      'ANSWER_CORRECT',
      team.event,
      team,
      { id: principal.playerId },
      { levelNumber: level.levelNumber, stageNumber: currentStage, attemptNumber },
      'PLAYER'
    );

    if (principal.playerNumber === 1) {
      stageProgress.player1Completed = true;
    } else {
      stageProgress.player2Completed = true;
    }

    const partnerCompleted = (principal.playerNumber === 1) ? stageProgress.player2Completed : stageProgress.player1Completed;
    const stageFinished = Boolean(stageProgress.player1Completed && stageProgress.player2Completed);

    if (stageFinished) {
      stageProgress.completedAt = new Date().toISOString();
    }
    await teamStageProgressRepository.save(stageProgress);

    // Broadcast challenge completed notification
    webSocketService.broadcastToTeam(team.id, {
      type: 'PARTNER_CHALLENGE_COMPLETED',
      teamId: team.id,
      playerId: principal.playerId,
      playerNumber: principal.playerNumber,
      levelNumber: level.levelNumber,
      stageNumber: currentStage,
      message: `${principal.displayName} verified stage telemetry ✓`,
      timestamp: new Date().toISOString()
    });

    if (stageFinished) {
      await scoringService.recordMiniGameCompletion(team.id, level.levelNumber, currentStage);

      webSocketService.broadcastToTeam(team.id, {
        type: 'STAGE_COMPLETED',
        teamId: team.id,
        levelNumber: level.levelNumber,
        stageNumber: currentStage,
        message: `Level ${level.levelNumber} Stage ${currentStage} completed!`,
        timestamp: new Date().toISOString()
      });

      const isFinalStage = (currentStage >= totalStages);
      if (isFinalStage) {
        const gameStateService = require('./gameStateService');
        await gameStateService.completeLevel(team.id, level.levelNumber);

        webSocketService.broadcastToTeam(team.id, {
          type: 'LEVEL_COMPLETED',
          teamId: team.id,
          levelNumber: level.levelNumber,
          message: `Level ${level.levelNumber} completed! Both operators synchronized.`,
          timestamp: new Date().toISOString()
        });

        return {
          correct: true,
          isCorrect: true,
          status: 'CORRECT',
          isCompleted: true,
          stageCompleted: true,
          stageNumber: currentStage,
          nextStageNumber: null,
          message: 'Level completed. Both players solved the final stage.'
        };
      } else {
        return {
          correct: true,
          isCorrect: true,
          status: 'CORRECT',
          isCompleted: true,
          stageCompleted: true,
          stageNumber: currentStage,
          nextStageNumber: currentStage + 1,
          message: 'Stage completed. The next cooperative stage is now available.'
        };
      }
    } else {
      return {
        correct: true,
        isCorrect: true,
        status: 'CORRECT',
        isCompleted: true,
        stageCompleted: false,
        stageNumber: currentStage,
        nextStageNumber: null,
        message: 'ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.'
      };
    }
  }
}

module.exports = new QuestionAnswerService();
