const db = require('../config/db');

class LevelRepository {
  async findAllActive() {
    const res = await db.query(
      `SELECT * FROM levels WHERE is_active = true ORDER BY level_number ASC`
    );
    return res.rows.map(this._mapRow);
  }

  async findById(id) {
    const res = await db.query(`SELECT * FROM levels WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByLevelNumber(levelNumber) {
    const res = await db.query(
      `SELECT * FROM levels WHERE level_number = $1`,
      [levelNumber]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      levelNumber: parseInt(r.level_number, 10),
      name: r.name,
      description: r.description,
      difficulty: r.difficulty,
      isActive: r.is_active !== false,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new LevelRepository();
