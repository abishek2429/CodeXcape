const db = require('../config/db');

class HintUsageRepository {
  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT hu.*, l.level_number
       FROM hint_usage hu
       JOIN levels l ON hu.level_id = l.id
       WHERE hu.team_id = $1`,
      [teamId]
    );
    return res.rows.map(r => ({
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      levelId: parseInt(r.level_id, 10),
      levelNumber: parseInt(r.level_number, 10),
      stageNumber: parseInt(r.stage_number, 10),
      hintNumber: parseInt(r.hint_number, 10),
      usedAt: r.used_at
    }));
  }

  async existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(teamId, levelId, stageNumber, hintNumber) {
    const res = await db.query(
      `SELECT 1 FROM hint_usage 
       WHERE team_id = $1 AND level_id = $2 AND stage_number = $3 AND hint_number = $4
       LIMIT 1`,
      [teamId, levelId, stageNumber, hintNumber]
    );
    return res.rows.length > 0;
  }

  async recordUsage(teamId, levelId, stageNumber, hintNumber = 1) {
    try {
      const res = await db.query(
        `INSERT INTO hint_usage (team_id, level_id, stage_number, hint_number, used_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [teamId, levelId, stageNumber, hintNumber]
      );
      return res.rows[0];
    } catch (e) {
      if (e.code === '23505') {
        // Unique violation: already used
        return null;
      }
      throw e;
    }
  }

  async deleteByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM hint_usage WHERE team_id = $1`, [teamId]);
  }

  async deleteAll(client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM hint_usage`);
  }
}

module.exports = new HintUsageRepository();
