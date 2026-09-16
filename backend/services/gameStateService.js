const teamRepository = require('../repositories/teamRepository');
const levelRepository = require('../repositories/levelRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../repositories/teamStageProgressRepository');
const questionRepository = require('../repositories/questionRepository');
const eventRepository = require('../repositories/eventRepository');
const cinematicStoryService = require('./cinematicStoryService');
const webSocketService = require('./webSocketService');
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

    const activeLevels = await levelRepository.findAllActive();
    const gameLevels = activeLevels.filter(l => l.levelNumber >= 1 && l.levelNumber <= 6);

    if (gameLevels.length === 0) {
      throw new ResourceNotFoundException('No active game levels configured in the system.');
    }

    const now = new Date().toISOString();
    const progressList = [];

    for (let i = 0; i < gameLevels.length; i++) {
      const level = gameLevels[i];
      const status = (i === 0) ? 'AVAILABLE' : 'LOCKED';
      const startedAt = (i === 0 && markStarted) ? now : null;

      const p = await teamLevelProgressRepository.save({
        teamId: team.id,
        levelId: level.id,
        levelStatus: status,
        player1Completed: false,
        player2Completed: false,
        startedAt
      });
      progressList.push(p);

      // Seed stage progress
      const totalStages = (level.levelNumber >= 4) ? 3 : 2;
      for (let s = 1; s <= totalStages; s++) {
        await teamStageProgressRepository.save({
          teamId: team.id,
          levelId: level.id,
          stageNumber: s,
          player1Completed: false,
          player2Completed: false,
          discoveryKey: `DISCOVERY-L${level.levelNumber}-S${s}`
        });
      }
    }

    if (markStarted) {
      team.startedAt = now;
      team.totalStoryPauseSeconds = 0;
      team.storyPausedAt = null;
      team.gameState = 'IN_PROGRESS';
      await teamRepository.save(team);

      // Trigger opening Prologue
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
        deadline: null
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
      deadline
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

  async completeLevel(teamId, levelNumber) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const level = await levelRepository.findByLevelNumber(levelNumber);
    if (!level) throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);

    const progress = await teamLevelProgressRepository.findByTeamIdAndLevelId(teamId, level.id);
    if (!progress) throw new ResourceNotFoundException('Level progress not initialized for team.');

    if (progress.levelStatus === 'LOCKED') {
      throw new InvalidLevelTransitionException(`Cannot complete Level ${levelNumber} because it is currently locked.`);
    }

    if (progress.levelStatus === 'COMPLETED') {
      return;
    }

    progress.levelStatus = 'COMPLETED';
    progress.completedAt = new Date().toISOString();
    await teamLevelProgressRepository.save(progress);

    team.completedLevels = (team.completedLevels || 0) + 1;

    if (levelNumber < 6) {
      const nextLevel = await levelRepository.findByLevelNumber(levelNumber + 1);
      if (nextLevel) {
        const nextProgress = await teamLevelProgressRepository.findByTeamIdAndLevelId(teamId, nextLevel.id);
        if (nextProgress && nextProgress.levelStatus === 'LOCKED') {
          nextProgress.levelStatus = 'AVAILABLE';
          nextProgress.startedAt = new Date().toISOString();
          await teamLevelProgressRepository.save(nextProgress);
        }
      }
      team.gameState = 'IN_PROGRESS';
      await teamRepository.save(team);
      await cinematicStoryService.triggerStory(team, `STORY_L${levelNumber + 1}_INTRO`);
    } else if (levelNumber === 6) {
      team.gameState = 'FINAL_PASSKEY';
      await teamRepository.save(team);
      await cinematicStoryService.triggerStory(team, 'STORY_FINAL_PROTOCOL');
    }

    const leaderboardService = require('./admin/leaderboardService');
    await leaderboardService.recalculateAndBroadcastRanks(team.eventId);
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

    return {
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      playerNumber: principal.playerNumber,
      displayName: principal.displayName,
      gameState: team.gameState,
      currentLevel,
      currentRank,
      isCompleted,
      completedAt: team.completedAt,
      myCompletedCurrentLevel: myCompleted,
      partnerCompletedCurrentLevel: partnerCompleted
    };
  }
}

module.exports = new GameStateService();
