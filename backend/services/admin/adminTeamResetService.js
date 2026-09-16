const teamRepository = require('../../repositories/teamRepository');
const teamLevelProgressRepository = require('../../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../../repositories/teamStageProgressRepository');
const teamStoryProgressRepository = require('../../repositories/teamStoryProgressRepository');
const answerAttemptRepository = require('../../repositories/answerAttemptRepository');
const webSocketPublisher = require('../webSocketService');
const adminAuditService = require('./adminAuditService');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class AdminTeamResetService {
  async resetTeamProgress(principal, teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new ResourceNotFoundException(`Team not found for ID ${teamId}`);
    }

    const progressList = await teamLevelProgressRepository.findByTeamId(team.id);

    for (const progress of progressList) {
      const levelNum = progress.levelNumber || (progress.level && progress.level.levelNumber) || 1;
      if (levelNum === 1) {
        progress.levelStatus = 'AVAILABLE';
        progress.startedAt = new Date().toISOString();
      } else {
        progress.levelStatus = 'LOCKED';
        progress.startedAt = null;
      }
      progress.player1Completed = false;
      progress.player2Completed = false;
      progress.completedAt = null;
      await teamLevelProgressRepository.save(progress);
    }

    // Reset stage progress for team
    const stageProgressList = await teamStageProgressRepository.findByTeamId(team.id);
    for (const sp of stageProgressList) {
      sp.player1Completed = false;
      sp.player2Completed = false;
      sp.completedAt = null;
      await teamStageProgressRepository.save(sp);
    }

    // Delete answer attempts for team
    await answerAttemptRepository.deleteByTeamId(team.id);

    // Reset story progression so team can experience the full narrative freshly
    await teamStoryProgressRepository.deleteByTeamId(team.id);

    // Reset team state
    const now = new Date().toISOString();
    team.gameState = 'IN_PROGRESS';
    team.startedAt = now;
    team.completedAt = null;
    team.currentStoryKey = null;
    team.storyPausedAt = null;
    team.totalStoryPauseSeconds = 0;
    await teamRepository.save(team);

    await adminAuditService.logAction(
      principal,
      'RESET_TEAM',
      `Team ${team.teamCode} (#${team.id})`,
      'Reset level progress, answer attempts, and completion state'
    );

    // Broadcast WebSocket update
    webSocketPublisher.notifyEventStatusChange(team.id, 'Team progress was reset by the organizer.');
  }
}

module.exports = new AdminTeamResetService();
