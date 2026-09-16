const db = require('../config/db');

class AuditService {
  async logEvent(eventType, event, team, player, detailsJson, source = 'SYSTEM', client = null) {
    try {
      const eventId = event ? (event.id || event) : (team && team.eventId ? team.eventId : null);
      const teamId = team ? (team.id || team) : null;
      const playerId = player ? (player.id || player) : null;

      const details = typeof detailsJson === 'object' ? JSON.stringify(detailsJson) : (detailsJson || null);

      const executor = client || db;
      await executor.query(
        `INSERT INTO game_events (event_type, event_id, team_id, player_id, details_json, source, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [eventType, eventId, teamId, playerId, details, source]
      );
    } catch (e) {
      console.warn('Failed to log game audit event:', e.message);
    }
  }
}

module.exports = new AuditService();
