const teamRepository = require('../repositories/teamRepository');
const levelRepository = require('../repositories/levelRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../repositories/teamStageProgressRepository');
const questionRepository = require('../repositories/questionRepository');
const eventRepository = require('../repositories/eventRepository');
const cinematicStoryService = require('./cinematicStoryService');
const webSocketService = require('./webSocketService');
const { withTransaction } = require('../config/db');
const {
  ResourceNotFoundException,
  InvalidLevelTransitionException,
  EventUnavailableException
} = require('../middleware/errorHandler');

const GAME_DURATION_SECONDS = 100 * 60; // 6000s = 100 minutes

class GameStateService {
  async initializeTeamGameState(team, markStarted = false) {
    const existing = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    if (existing.length > 0) {
      if (markStarted && team.gameState === 'NOT_STARTED') {
        const now = new Date().toISOString();
        team.startedAt = now;
        team.totalStoryPauseSeconds = 0;
        team.storyPausedAt = null;
        team.gameState = 'IN_PROGRESS';
        await teamRepository.save(team);
        await cinematicStoryService.triggerStory(team, 'STORY_PROLOGUE');
      }
      return existing;
    }

    const allLevels = await levelRepository.findAllOrderByLevelNumberAsc();
    const progressList = [];

    for (let i = 0; i < allLevels.length; i++) {
      const lvl = allLevels[i];
      const isFirst = (i === 0);
      const lp = await teamLevelProgressRepository.save({
        teamId: team.id,
        levelId: lvl.id,
        levelStatus: isFirst ? 'AVAILABLE' : 'LOCKED',
        startedAt: isFirst && markStarted ? new Date().toISOString() : null
      });
      progressList.push({
        ...lp,
        level: lvl
      });
    }

    if (markStarted) {
      const now = new Date().toISOString();
      team.startedAt = now;
      team.totalStoryPauseSeconds = 0;
      team.storyPausedAt = null;
      team.gameState = 'IN_PROGRESS';
      await teamRepository.save(team);
      await cinematicStoryService.triggerStory(team, 'STORY_PROLOGUE');
    }

    return progressList;
  }

  async getGameStateForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const event = team.event;
    const serverTime = new Date().toISOString();

    if (team.gameState === 'NOT_STARTED') {
      return {
        teamCode: team.teamCode,
        teamName: team.teamName,
        gameStatus: team.gameState,
        currentLevel: 1,
        currentRank: null,
        eventStatus: event ? event.status : null,
        levels: [],
        serverTime,
        deadline: null,
        stateVersion: team.stateVersion || 1
      };
    }

    let progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    if (progressList.length === 0 && (event.status === 'READY' || event.status === 'RUNNING')) {
      progressList = await this.initializeTeamGameState(team);
    }

    let teamStartTime = team.startedAt ? new Date(team.startedAt) : null;
    let totalStoryPause = team.totalStoryPauseSeconds || 0;
    if (team.currentStoryKey && team.storyPausedAt) {
      totalStoryPause += Math.max(0, Math.floor((Date.now() - new Date(team.storyPausedAt).getTime()) / 1000));
    }

    if ((team.gameState === 'IN_PROGRESS' || team.gameState === 'FINAL_PASSKEY') && !teamStartTime) {
      team.startedAt = serverTime;
      await teamRepository.save(team);
      teamStartTime = new Date(serverTime);
    }

    const deadline = teamStartTime
      ? new Date(teamStartTime.getTime() + (GAME_DURATION_SECONDS + totalStoryPause) * 1000).toISOString()
      : null;

    let currentLevelNumber = 1;
    if (progressList.length > 0) {
      const currentActive = progressList.find(
        p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
      );
      if (currentActive) {
        currentLevelNumber = currentActive.level.levelNumber;
      } else {
        const completedCount = progressList.filter(p => p.levelStatus === 'COMPLETED').length;
        if (completedCount === progressList.length && progressList.length > 0) {
          currentLevelNumber = progressList.length;
          if (team.gameState !== 'COMPLETED') {
            team.gameState = 'FINAL_PASSKEY';
            await teamRepository.save(team);
          }
        }
      }
    }

    const levelDtos = progressList.map(p => ({
      levelNumber: p.level.levelNumber,
      name: p.level.name,
      status: p.levelStatus
    }));

    const leaderboardService = require('./admin/leaderboardService');
    const currentRank = await leaderboardService.getTeamCurrentRank(team.id);

    return {
      teamCode: team.teamCode,
      teamName: team.teamName,
      gameStatus: team.gameState,
      currentLevel: currentLevelNumber,
      currentRank,
      eventStatus: event ? event.status : null,
      levels: levelDtos,
      serverTime,
      deadline,
      stateVersion: team.stateVersion || 1
    };
  }

  async getCurrentLevelForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    if (team.event.status !== 'RUNNING' && team.event.status !== 'READY') {
      throw new EventUnavailableException('The event is not currently active.');
    }

    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    const currentProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );

    if (!currentProgress) {
      throw new InvalidLevelTransitionException('No active level available for current team state.');
    }

    const level = await levelRepository.findById(currentProgress.levelId);
    return {
      levelNumber: level.levelNumber,
      name: level.name,
      description: level.description,
      difficulty: level.difficulty
    };
  }

  async completeLevel(teamId, levelNumber, existingClient = null) {
    const executeComplete = async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) throw new ResourceNotFoundException('Team not found.');

      const level = await levelRepository.findByLevelNumber(levelNumber, client);
      if (!level) throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);

      const progress = await teamLevelProgressRepository.findByTeamIdAndLevelId(teamId, level.id, client);
      if (!progress) throw new ResourceNotFoundException('Level progress not initialized for team.');

      if (progress.levelStatus === 'LOCKED') {
        throw new InvalidLevelTransitionException(`Cannot complete Level ${levelNumber} because it is currently locked.`);
      }

      if (progress.levelStatus === 'COMPLETED') {
        return { team, level, alreadyCompleted: true };
      }

      // Mark current level COMPLETED
      progress.levelStatus = 'COMPLETED';
      progress.completedAt = new Date().toISOString();
      await teamLevelProgressRepository.save(progress, client);

      team.completedLevels = (team.completedLevels || 0) + 1;
      team.stateVersion = (team.stateVersion || 1) + 1;

      // Unpack next level atomically inside the SAME transaction
      let nextStoryKey = null;
      if (levelNumber < 6) {
        const nextLevel = await levelRepository.findByLevelNumber(levelNumber + 1, client);
        if (nextLevel) {
          const nextProgress = await teamLevelProgressRepository.findByTeamIdAndLevelId(teamId, nextLevel.id, client);
          if (nextProgress && nextProgress.levelStatus === 'LOCKED') {
            nextProgress.levelStatus = 'AVAILABLE';
            nextProgress.startedAt = new Date().toISOString();
            await teamLevelProgressRepository.save(nextProgress, client);
          }
        }
        team.gameState = 'IN_PROGRESS';
        nextStoryKey = `STORY_L${levelNumber + 1}_INTRO`;
      } else if (levelNumber === 6) {
        team.gameState = 'FINAL_PASSKEY';
        nextStoryKey = 'STORY_FINAL_PROTOCOL';
      }

      const savedTeam = await teamRepository.save(team, client);
      return { team: savedTeam, level, nextStoryKey, alreadyCompleted: false };
    };

    let result;
    if (existingClient) {
      result = await executeComplete(existingClient);
    } else {
      result = await withTransaction(executeComplete);
    }

    if (result.alreadyCompleted) {
      return result.team;
    }

    const { team, nextStoryKey } = result;

    // Broadcast LEVEL_COMPLETED after atomic commit so next level is ALREADY AVAILABLE in database
    webSocketService.broadcastToTeam(team.id, {
      type: 'LEVEL_COMPLETED',
      teamId: team.id,
      levelNumber,
      nextLevelNumber: levelNumber < 6 ? levelNumber + 1 : 6,
      stateVersion: team.stateVersion,
      message: `Level ${levelNumber} completed! Both operators synchronized.`,
      timestamp: new Date().toISOString()
    });

    if (nextStoryKey) {
      await cinematicStoryService.triggerStory(team, nextStoryKey);
    }

    const leaderboardService = require('./admin/leaderboardService');
    leaderboardService.recalculateAndBroadcastRanks(team.eventId).catch(() => {});

    return team;
  }

  async getFullResyncStateForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    const activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );

    const currentLevel = activeProgress ? activeProgress.level.levelNumber : (team.gameState === 'COMPLETED' ? 6 : 1);
    const isCompleted = (team.gameState === 'COMPLETED');

    let myCompleted = false;
    let partnerCompleted = false;

    if (activeProgress) {
      if (principal.playerNumber === 1) {
        myCompleted = Boolean(activeProgress.player1Completed);
        partnerCompleted = Boolean(activeProgress.player2Completed);
      } else {
        myCompleted = Boolean(activeProgress.player2Completed);
        partnerCompleted = Boolean(activeProgress.player1Completed);
      }
    }

    const leaderboardService = require('./admin/leaderboardService');
    const currentRank = await leaderboardService.getTeamCurrentRank(team.id);

    let currentStage = 1;
    let myCompletedStage = false;
    let partnerCompletedStage = false;

    if (activeProgress) {
      const questionAnswerService = require('./questionAnswerService');
      currentStage = await questionAnswerService.findCurrentStage(team.id, activeProgress.levelId, currentLevel);
      const stageProgress = await teamStageProgressRepository.findByTeamIdAndLevelIdAndStageNumber(team.id, activeProgress.levelId, currentStage);
      if (stageProgress) {
        if (principal.playerNumber === 1) {
          myCompletedStage = Boolean(stageProgress.player1Completed);
          partnerCompletedStage = Boolean(stageProgress.player2Completed);
        } else {
          myCompletedStage = Boolean(stageProgress.player2Completed);
          partnerCompletedStage = Boolean(stageProgress.player1Completed);
        }
      }
    }

    const teamScore = {
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      baseScore: team.baseScore || 0,
      hintPenalty: team.hintPenalty || 0,
      wrongAttemptPenalty: team.wrongAttemptPenalty || 0,
      antiCheatPenalty: team.antiCheatPenalty || 0,
      finalScore: team.finalScore || 0,
      stagesCompleted: team.completedMiniGames || 0,
      totalStages: 15,
      rank: currentRank || 0
    };

    return {
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      playerNumber: principal.playerNumber,
      displayName: principal.displayName,
      gameState: team.gameState,
      currentLevel,
      currentStage,
      currentRank,
      isCompleted,
      completedAt: team.completedAt,
      myCompletedCurrentLevel: myCompleted,
      partnerCompletedCurrentLevel: partnerCompleted,
      myCompletedCurrentStage: myCompletedStage,
      partnerCompletedCurrentStage: partnerCompletedStage,
      teamScore,
      stateVersion: team.stateVersion || 1
    };
  }
}

module.exports = new GameStateService();
