const db = require('../config/db');

class TeamAntiCheatSummaryRepository {
  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT tacs.*, t.team_code, t.team_name
       FROM team_anti_cheat_summary tacs
       JOIN teams t ON tacs.team_id = t.id
       WHERE tacs.team_id = $1`,
      [teamId]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByEventId(eventId) {
    const res = await db.query(
      `SELECT tacs.*, t.team_code, t.team_name
       FROM team_anti_cheat_summary tacs
       JOIN teams t ON tacs.team_id = t.id
       WHERE t.event_id = $1
       ORDER BY tacs.total_penalty_points DESC`,
      [eventId]
    );
    return res.rows.map(this._mapRow);
  }

  async upsert(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO team_anti_cheat_summary (
         team_id, total_penalty_points, total_violations,
         tab_switch_count, fullscreen_exit_count, prolonged_hidden_count,
         last_violation_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, NOW()
       ) ON CONFLICT (team_id) DO UPDATE SET
         total_penalty_points = EXCLUDED.total_penalty_points,
         total_violations = EXCLUDED.total_violations,
         tab_switch_count = EXCLUDED.tab_switch_count,
         fullscreen_exit_count = EXCLUDED.fullscreen_exit_count,
         prolonged_hidden_count = EXCLUDED.prolonged_hidden_count,
         last_violation_at = EXCLUDED.last_violation_at,
         updated_at = NOW()
       RETURNING *`,
      [
        data.teamId,
        data.totalPenaltyPoints || 0,
        data.totalViolations || 0,
        data.tabSwitchCount || 0,
        data.fullscreenExitCount || 0,
        data.prolongedHiddenCount || 0,
        data.lastViolationAt || null
      ]
    );
    return this._mapRow(res.rows[0]);
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      teamId: parseInt(r.team_id, 10),
      teamCode: r.team_code,
      teamName: r.team_name,
      totalPenaltyPoints: parseInt(r.total_penalty_points || 0, 10),
      totalViolations: parseInt(r.total_violations || 0, 10),
      tabSwitchCount: parseInt(r.tab_switch_count || 0, 10),
      fullscreenExitCount: parseInt(r.fullscreen_exit_count || 0, 10),
      prolongedHiddenCount: parseInt(r.prolonged_hidden_count || 0, 10),
      lastViolationAt: r.last_violation_at
    };
  }
}

module.exports = new TeamAntiCheatSummaryRepository();
