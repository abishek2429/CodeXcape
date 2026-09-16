const teamRepository = require('../repositories/teamRepository');
const teamStoryProgressRepository = require('../repositories/teamStoryProgressRepository');
const storyConfig = require('../config/storyConfig');
const webSocketService = require('./webSocketService');
const { ResourceNotFoundException } = require('../middleware/errorHandler');

class CinematicStoryService {
  buildActiveState(team) {
    const hasActiveStory = Boolean(team.currentStoryKey);
    const sequence = hasActiveStory ? storyConfig.getSequence(team.currentStoryKey) : null;

    return {
      hasActiveStory,
      storyKey: team.currentStoryKey || null,
      title: sequence ? sequence.title : null,
      subTitle: sequence ? sequence.subTitle : null,
      canSkip: sequence ? sequence.canSkip : true,
      lines: sequence ? sequence.lines : [],
      pausedAt: team.storyPausedAt || null,
      totalPauseSeconds: team.totalStoryPauseSeconds || 0
    };
  }

  async triggerStory(teamOrId, storyKey) {
    let team = typeof teamOrId === 'object' ? teamOrId : await teamRepository.findById(teamOrId);
    if (!team || !storyKey) return null;

    // Idempotency check: has this story already been completed or skipped?
    const alreadyResolved = await teamStoryProgressRepository.existsByTeamIdAndStoryKey(team.id, storyKey);
    if (alreadyResolved) {
      return this.buildActiveState(team);
    }

    if (storyKey === team.currentStoryKey) {
      return this.buildActiveState(team);
    }

    const seq = storyConfig.getSequence(storyKey);
    if (!seq) {
      return this.buildActiveState(team);
    }

    const now = new Date().toISOString();
    team.currentStoryKey = storyKey;
    team.storyPausedAt = now;
    await teamRepository.save(team);

    await teamStoryProgressRepository.save({
      teamId: team.id,
      storyKey,
      status: 'ACTIVE',
      pauseDurationSeconds: 0
    });

    const state = this.buildActiveState(team);
    webSocketService.notifyStoryStarted(team.id, storyKey, state);
    return state;
  }

  async skipStory(teamId, playerId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found');

    if (!team.currentStoryKey) {
      return this.buildActiveState(team);
    }

    const storyKey = team.currentStoryKey;
    let pauseSec = 0;
    if (team.storyPausedAt) {
      pauseSec = Math.max(0, Math.floor((Date.now() - new Date(team.storyPausedAt).getTime()) / 1000));
      team.totalStoryPauseSeconds = (team.totalStoryPauseSeconds || 0) + pauseSec;
    }

    team.currentStoryKey = null;
    team.storyPausedAt = null;
    await teamRepository.save(team);

    const progress = await teamStoryProgressRepository.findByTeamIdAndStoryKey(team.id, storyKey);
    if (progress) {
      progress.status = 'SKIPPED';
      progress.completedAt = new Date().toISOString();
      progress.completedByPlayerId = playerId;
      progress.pauseDurationSeconds = pauseSec;
      await teamStoryProgressRepository.save(progress);
    }

    webSocketService.notifyStoryCompleted(team.id, storyKey);
    return this.buildActiveState(team);
  }

  async completeStory(teamId, playerId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found');

    if (!team.currentStoryKey) {
      return this.buildActiveState(team);
    }

    const storyKey = team.currentStoryKey;
    let pauseSec = 0;
    if (team.storyPausedAt) {
      pauseSec = Math.max(0, Math.floor((Date.now() - new Date(team.storyPausedAt).getTime()) / 1000));
      team.totalStoryPauseSeconds = (team.totalStoryPauseSeconds || 0) + pauseSec;
    }

    team.currentStoryKey = null;
    team.storyPausedAt = null;
    await teamRepository.save(team);

    const progress = await teamStoryProgressRepository.findByTeamIdAndStoryKey(team.id, storyKey);
    if (progress) {
      progress.status = 'COMPLETED';
      progress.completedAt = new Date().toISOString();
      progress.completedByPlayerId = playerId;
      progress.pauseDurationSeconds = pauseSec;
      await teamStoryProgressRepository.save(progress);
    }

    webSocketService.notifyStoryCompleted(team.id, storyKey);
    return this.buildActiveState(team);
  }

  async replayStory(teamId, storyKey) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found');

    const seq = storyConfig.getSequence(storyKey);
    if (!seq) {
      return this.buildActiveState(team);
    }

    // Passive viewing: do not pause game timer for replays
    team.currentStoryKey = storyKey;
    team.storyPausedAt = null;
    await teamRepository.save(team);

    return this.buildActiveState(team);
  }

  async getResolvedStoryKeys(teamId) {
    return teamStoryProgressRepository.findResolvedByTeamId(teamId);
  }

  async getCurrentStoryState(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found');
    return this.buildActiveState(team);
  }
}

module.exports = new CinematicStoryService();
