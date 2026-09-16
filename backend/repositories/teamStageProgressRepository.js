const db = require('../config/db');

class TeamStageProgressRepository {
  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT * FROM team_stage_progress
       WHERE team_id = $1
       ORDER BY level_id ASC, stage_number ASC`,
      [teamId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByTeamIdAndLevelIdOrderByStageNumberAsc(teamId, levelId) {
    const res = await db.query(
      `SELECT * FROM team_stage_progress
       WHERE team_id = $1 AND level_id = $2
       ORDER BY stage_number ASC`,
      [teamId, levelId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByTeamIdAndLevelIdAndStageNumber(teamId, levelId, stageNumber) {
    const res = await db.query(
      `SELECT * FROM team_stage_progress
       WHERE team_id = $1 AND level_id = $2 AND stage_number = $3`,
      [teamId, levelId, stageNumber]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findForUpdate(teamId, levelId, stageNumber, client) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT * FROM team_stage_progress
       WHERE team_id = $1 AND level_id = $2 AND stage_number = $3
       FOR UPDATE`,
      [teamId, levelId, stageNumber]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async save(sp, client = null) {
    const executor = client || db;
    if (sp.id) {
      const res = await executor.query(
        `UPDATE team_stage_progress SET
           player1_completed = $2,
           player2_completed = $3,
           completed_at = $4,
           discovery_key = $5
         WHERE id = $1
         RETURNING *`,
        [
          sp.id,
          sp.player1Completed ?? false,
          sp.player2Completed ?? false,
          sp.completedAt,
          sp.discoveryKey || ''
        ]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await executor.query(
        `INSERT INTO team_stage_progress (
           team_id, level_id, stage_number, player1_completed, player2_completed, completed_at, discovery_key, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, NOW()
         ) RETURNING *`,
        [
          sp.teamId,
          sp.levelId,
          sp.stageNumber,
          sp.player1Completed ?? false,
          sp.player2Completed ?? false,
          sp.completedAt || null,
          sp.discoveryKey || ''
        ]
      );
      return this._mapRow(res.rows[0]);
    }
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      levelId: parseInt(r.level_id, 10),
      stageNumber: parseInt(r.stage_number, 10),
      player1Completed: Boolean(r.player1_completed),
      player2Completed: Boolean(r.player2_completed),
      completedAt: r.completed_at,
      discoveryKey: r.discovery_key,
      createdAt: r.created_at
    };
  }
}

module.exports = new TeamStageProgressRepository();
