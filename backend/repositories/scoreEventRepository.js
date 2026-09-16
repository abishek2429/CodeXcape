const db = require('../config/db');

class ScoreEventRepository {
  async existsByTeamIdAndReferenceId(teamId, referenceId) {
    const res = await db.query(
      `SELECT 1 FROM score_events WHERE team_id = $1 AND reference_id = $2 LIMIT 1`,
      [teamId, referenceId]
    );
    return res.rows.length > 0;
  }

  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT se.*, p.display_name AS player_name
       FROM score_events se
       LEFT JOIN players p ON se.player_id = p.id
       WHERE se.team_id = $1
       ORDER BY se.created_at ASC`,
      [teamId]
    );
    return res.rows.map(r => ({
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      playerId: r.player_id ? parseInt(r.player_id, 10) : null,
      playerName: r.player_name,
      eventType: r.event_type,
      referenceId: r.reference_id,
      pointsDelta: parseInt(r.points_delta || 0, 10),
      reason: r.reason,
      createdAt: r.created_at
    }));
  }

  async recordScoreEvent(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO score_events (team_id, player_id, event_type, reference_id, points_delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        data.teamId,
        data.playerId || null,
        data.eventType,
        data.referenceId,
        data.pointsDelta,
        data.reason || ''
      ]
    );
    return res.rows[0];
  }

  async deleteByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM score_events WHERE team_id = $1`, [teamId]);
  }

  async deleteAll(client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM score_events`);
  }
}

module.exports = new ScoreEventRepository();

