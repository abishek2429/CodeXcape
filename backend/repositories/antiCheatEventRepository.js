const db = require('../config/db');

class AntiCheatEventRepository {
  async findByEventId(eventId) {
    const res = await db.query(
      `SELECT ace.*, t.team_code, t.team_name, p.display_name, p.player_number
       FROM anti_cheat_events ace
       JOIN teams t ON ace.team_id = t.id
       JOIN players p ON ace.player_id = p.id
       WHERE ace.event_id = $1
       ORDER BY ace.detected_at DESC`,
      [eventId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT ace.*, t.team_code, t.team_name, p.display_name, p.player_number
       FROM anti_cheat_events ace
       JOIN teams t ON ace.team_id = t.id
       JOIN players p ON ace.player_id = p.id
       WHERE ace.team_id = $1
       ORDER BY ace.detected_at DESC`,
      [teamId]
    );
    return res.rows.map(this._mapRow);
  }

  async recordEvent(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO anti_cheat_events (
         team_id, player_id, event_id, violation_type, detected_at,
         duration_ms, penalty_points, incident_key, metadata, created_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, NOW()
       ) RETURNING *`,
      [
        data.teamId,
        data.playerId,
        data.eventId,
        data.violationType,
        data.detectedAt || new Date().toISOString(),
        data.durationMs || 0,
        data.penaltyPoints || 0,
        data.incidentKey || null,
        data.metadata ? String(data.metadata).substring(0, 255) : null
      ]
    );
    return this._mapRow(res.rows[0]);
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      teamCode: r.team_code,
      teamName: r.team_name,
      playerId: parseInt(r.player_id, 10),
      playerName: r.display_name,
      playerNumber: r.player_number != null ? parseInt(r.player_number, 10) : null,
      violationType: r.violation_type,
      penaltyPoints: parseInt(r.penalty_points || 0, 10),
      durationMs: r.duration_ms ? parseInt(r.duration_ms, 10) : 0,
      detectedAt: r.detected_at,
      metadata: r.metadata
    };
  }
}

module.exports = new AntiCheatEventRepository();
