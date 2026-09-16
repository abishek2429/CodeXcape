const db = require('../config/db');

class HintRepository {
  async findByLevelIdOrderByDisplayOrderAsc(levelId) {
    const res = await db.query(
      `SELECT * FROM hints WHERE level_id = $1 AND is_active = true ORDER BY display_order ASC`,
      [levelId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByLevelIdAndStageNumberOrderByDisplayOrderAsc(levelId, stageNumber) {
    // Stage number may be stored directly or mapped by display_order
    const res = await db.query(
      `SELECT * FROM hints 
       WHERE level_id = $1 AND is_active = true 
       ORDER BY display_order ASC`,
      [levelId]
    );
    const hints = res.rows.map(this._mapRow);
    const filtered = hints.filter(h => h.stageNumber === stageNumber);
    return filtered.length > 0 ? filtered : hints;
  }

  async saveHintConfig(data) {
    const existing = await db.query(
      `SELECT * FROM hints WHERE level_id = $1 AND display_order = $2`,
      [data.levelId, data.displayOrder || data.hintNumber || 1]
    );

    if (existing.rows.length > 0) {
      const res = await db.query(
        `UPDATE hints SET hint_content = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [existing.rows[0].id, data.hintContent]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await db.query(
        `INSERT INTO hints (level_id, display_order, hint_content, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         RETURNING *`,
        [data.levelId, data.displayOrder || data.hintNumber || 1, data.hintContent]
      );
      return this._mapRow(res.rows[0]);
    }
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      levelId: parseInt(r.level_id, 10),
      displayOrder: r.display_order != null ? parseInt(r.display_order, 10) : 1,
      stageNumber: r.display_order != null ? parseInt(r.display_order, 10) : 1,
      hintContent: r.hint_content,
      isActive: r.is_active !== false,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new HintRepository();
