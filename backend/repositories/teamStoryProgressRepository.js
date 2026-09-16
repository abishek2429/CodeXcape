const db = require('../config/db');

class TeamStoryProgressRepository {
  async existsByTeamIdAndStoryKey(teamId, storyKey) {
    const res = await db.query(
      `SELECT 1 FROM team_story_progress WHERE team_id = $1 AND story_key = $2 LIMIT 1`,
      [teamId, storyKey]
    );
    return res.rows.length > 0;
  }

  async findByTeamIdAndStoryKey(teamId, storyKey) {
    const res = await db.query(
      `SELECT * FROM team_story_progress WHERE team_id = $1 AND story_key = $2`,
      [teamId, storyKey]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findResolvedByTeamId(teamId) {
    const res = await db.query(
      `SELECT story_key FROM team_story_progress WHERE team_id = $1 ORDER BY id ASC`,
      [teamId]
    );
    return res.rows.map(r => r.story_key);
  }

  async save(sp, client = null) {
    const executor = client || db;
    if (sp.id) {
      const res = await executor.query(
        `UPDATE team_story_progress SET
           status = $2,
           ended_at = $3,
           pause_duration_seconds = $4
         WHERE id = $1
         RETURNING *`,
        [
          sp.id,
          sp.status,
          sp.endedAt || sp.completedAt || null,
          sp.pauseDurationSeconds || 0
        ]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await executor.query(
        `INSERT INTO team_story_progress (
           team_id, story_key, status, started_at, pause_duration_seconds
         ) VALUES (
           $1, $2, $3, NOW(), $4
         ) RETURNING *`,
        [
          sp.teamId,
          sp.storyKey,
          sp.status || 'ACTIVE',
          sp.pauseDurationSeconds || 0
        ]
      );
      return this._mapRow(res.rows[0]);
    }
  }

  async deleteByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM team_story_progress WHERE team_id = $1`, [teamId]);
  }

  async deleteAll(client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM team_story_progress`);
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      storyKey: r.story_key,
      status: r.status,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      completedAt: r.ended_at,
      pauseDurationSeconds: parseInt(r.pause_duration_seconds || 0, 10)
    };
  }
}

module.exports = new TeamStoryProgressRepository();
