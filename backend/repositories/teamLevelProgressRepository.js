const db = require('../config/db');

class TeamLevelProgressRepository {
  async findByTeamIdOrderByLevelIdAsc(teamId) {
    const res = await db.query(
      `SELECT tlp.*, l.level_number, l.name AS level_name
       FROM team_level_progress tlp
       JOIN levels l ON tlp.level_id = l.id
       WHERE tlp.team_id = $1
       ORDER BY l.level_number ASC`,
      [teamId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByTeamId(teamId) {
    return this.findByTeamIdOrderByLevelIdAsc(teamId);
  }

  async findByTeamIdAndLevelId(teamId, levelId) {
    const res = await db.query(
      `SELECT tlp.*, l.level_number, l.name AS level_name
       FROM team_level_progress tlp
       JOIN levels l ON tlp.level_id = l.id
       WHERE tlp.team_id = $1 AND tlp.level_id = $2`,
      [teamId, levelId]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findForUpdateByTeamIdAndLevelId(teamId, levelId, client) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT tlp.*, l.level_number, l.name AS level_name
       FROM team_level_progress tlp
       JOIN levels l ON tlp.level_id = l.id
       WHERE tlp.team_id = $1 AND tlp.level_id = $2 FOR UPDATE`,
      [teamId, levelId]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async save(progress, client = null) {
    const executor = client || db;
    if (progress.id) {
      const res = await executor.query(
        `UPDATE team_level_progress SET
           level_status = $2,
           player1_completed = $3,
           player2_completed = $4,
           started_at = $5,
           completed_at = $6,
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          progress.id,
          progress.levelStatus,
          progress.player1Completed ?? false,
          progress.player2Completed ?? false,
          progress.startedAt,
          progress.completedAt
        ]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await executor.query(
        `INSERT INTO team_level_progress (
           team_id, level_id, level_status, player1_completed, player2_completed, started_at, completed_at, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
         ) RETURNING *`,
        [
          progress.teamId,
          progress.levelId,
          progress.levelStatus || 'LOCKED',
          progress.player1Completed ?? false,
          progress.player2Completed ?? false,
          progress.startedAt || null,
          progress.completedAt || null
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
      levelStatus: r.level_status,
      player1Completed: Boolean(r.player1_completed),
      player2Completed: Boolean(r.player2_completed),
      startedAt: r.started_at,
      completedAt: r.completed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      level: {
        id: parseInt(r.level_id, 10),
        levelNumber: r.level_number != null ? parseInt(r.level_number, 10) : null,
        name: r.level_name
      }
    };
  }
}

module.exports = new TeamLevelProgressRepository();
