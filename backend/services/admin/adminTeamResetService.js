const teamRepository = require('../../repositories/teamRepository');
const playerRepository = require('../../repositories/playerRepository');
const teamLevelProgressRepository = require('../../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../../repositories/teamStageProgressRepository');
const teamStoryProgressRepository = require('../../repositories/teamStoryProgressRepository');
const answerAttemptRepository = require('../../repositories/answerAttemptRepository');
const scoreEventRepository = require('../../repositories/scoreEventRepository');
const hintUsageRepository = require('../../repositories/hintUsageRepository');
const teamRiddleProgressRepository = require('../../repositories/teamRiddleProgressRepository');
const teamAntiCheatSummaryRepository = require('../../repositories/teamAntiCheatSummaryRepository');
const eventRepository = require('../../repositories/eventRepository');
const leaderboardService = require('./leaderboardService');
const webSocketPublisher = require('../webSocketService');
const adminAuditService = require('./adminAuditService');
const { withTransaction } = require('../../config/db');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class AdminTeamResetService {
  async resetTeamProgress(principal, teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new ResourceNotFoundException(`Team not found for ID ${teamId}`);
    }

    await withTransaction(async (client) => {
      // 1. Reset team state & all score totals to 0
      await teamRepository.resetTeamStateById(team.id, client);

      // 2. Reset player statuses to INACTIVE and is_ready to false
      await playerRepository.resetStatusByTeamId(team.id, client);

      // 3. Reset level progress (Level 1 AVAILABLE, Levels 2-6 LOCKED)
      await teamLevelProgressRepository.resetByTeamId(team.id, client);

      // 4. Reset stage progress (all stages completed flags = false)
      await teamStageProgressRepository.resetByTeamId(team.id, client);

      // 5. Delete riddle progress (all 6 riddles locked)
      await teamRiddleProgressRepository.deleteByTeamId(team.id, client);

      // 6. Delete hint usage (all 15 hints unrevealed, no penalties)
      await hintUsageRepository.deleteByTeamId(team.id, client);

      // 7. Delete score events (points history cleared)
      await scoreEventRepository.deleteByTeamId(team.id, client);

      // 8. Delete answer attempts
      await answerAttemptRepository.deleteByTeamId(team.id, client);

      // 9. Delete story progress
      await teamStoryProgressRepository.deleteByTeamId(team.id, client);

      // 10. Delete anti-cheat summary for this run
      await teamAntiCheatSummaryRepository.deleteByTeamId(team.id, client);

      // 11. Legacy discovery submissions if table exists
      try {
        await client.query(`DELETE FROM discovery_submissions WHERE team_id = $1`, [team.id]);
      } catch (e) {
        // Table might not exist in all environments
      }

      // 12. Terminate all active sessions for this team
      await client.query(
        `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
         WHERE team_id = $1 AND status = 'ACTIVE'`,
        [team.id]
      );
    });

    // Clear leaderboard memory cache and recalculate
    leaderboardService.lastBroadcastRanks.clear();
    if (team.eventId) {
      await leaderboardService.recalculateAndBroadcastRanks(team.eventId);
    }

    await adminAuditService.logAction(
      principal,
      'RESET_TEAM',
      `Team ${team.teamCode} (#${team.id})`,
      'Reset all scores, progress, hints, riddles, and sessions'
    );

    // Broadcast WebSocket updates
    webSocketPublisher.broadcastToTeam(team.id, {
      type: 'TEAM_PROGRESS_RESET',
      teamId: team.id,
      message: 'Team game state has been reset to initial status by the organizer.',
      timestamp: new Date().toISOString()
    });
    webSocketPublisher.notifyEventStatusChange(team.id, 'Team progress was reset by the organizer.');
  }

  async resetAllTeams(principal) {
    await withTransaction(async (client) => {
      // 1. Reset all teams' state & score totals to 0
      await teamRepository.resetAllTeamStates(client);

      // 2. Reset all players' statuses to INACTIVE and is_ready to false
      await playerRepository.resetAllStatuses(client);

      // 3. Reset all level progress (Level 1 AVAILABLE, Levels 2-6 LOCKED)
      await teamLevelProgressRepository.resetAll(client);

      // 4. Reset all stage progress
      await teamStageProgressRepository.resetAll(client);

      // 5. Delete all riddle progress
      await teamRiddleProgressRepository.deleteAll(client);

      // 6. Delete all hint usage
      await hintUsageRepository.deleteAll(client);

      // 7. Delete all score events
      await scoreEventRepository.deleteAll(client);

      // 8. Delete all answer attempts
      await answerAttemptRepository.deleteAll(client);

      // 9. Delete all story progress
      await teamStoryProgressRepository.deleteAll(client);

      // 10. Delete all anti-cheat summaries for this run
      await teamAntiCheatSummaryRepository.deleteAll(client);

      // 11. Legacy discovery submissions if table exists
      try {
        await client.query(`DELETE FROM discovery_submissions`);
      } catch (e) {
        // Ignore if table does not exist
      }

      // 12. Terminate all active sessions
      await client.query(
        `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
         WHERE status = 'ACTIVE'`
      );
    });

    // Clear leaderboard memory cache and recalculate
    leaderboardService.lastBroadcastRanks.clear();
    const allEvents = await eventRepository.findAll();
    for (const ev of allEvents) {
      await leaderboardService.recalculateAndBroadcastRanks(ev.id);
    }

    await adminAuditService.logAction(
      principal,
      'RESET_ALL_SESSIONS_AND_CREDENTIALS',
      'GLOBAL',
      'Purged all sessions, reset all team scores, progress, hints, riddles to 0'
    );

    // Broadcast WebSocket global reset
    webSocketPublisher.broadcastAll({
      type: 'EVENT_RESET',
      message: 'All credentials, sessions, and game progress have been reset by administrator.',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new AdminTeamResetService();
