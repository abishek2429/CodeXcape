const db = require('../config/db');

class EventRepository {
  async findById(id) {
    const res = await db.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findAll() {
    const res = await db.query(`SELECT * FROM events ORDER BY id ASC`);
    return res.rows.map(r => this._mapRow(r));
  }

  async create(data) {
    const res = await db.query(
      `INSERT INTO events (name, description, status, passkey_hash, start_time, end_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        data.name,
        data.description || '',
        data.status || 'DRAFT',
        data.passkeyHash || '',
        data.startTime || null,
        data.endTime || null
      ]
    );
    return this._mapRow(res.rows[0]);
  }

  async update(id, data) {
    const res = await db.query(
      `UPDATE events
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           passkey_hash = COALESCE($5, passkey_hash),
           start_time = COALESCE($6, start_time),
           end_time = COALESCE($7, end_time),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.name,
        data.description,
        data.status,
        data.passkeyHash,
        data.startTime,
        data.endTime
      ]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async updateStatus(id, status) {
    const res = await db.query(
      `UPDATE events SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async updatePasskey(id, hash) {
    const res = await db.query(
      `UPDATE events SET passkey_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, hash]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      name: r.name,
      description: r.description,
      status: r.status,
      passkeyHash: r.passkey_hash,
      startTime: r.start_time,
      endTime: r.end_time,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new EventRepository();
