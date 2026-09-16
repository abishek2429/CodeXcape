const db = require('../config/db');

class AdminSessionRepository {
  async findBySessionToken(token) {
    const res = await db.query(
      `SELECT * FROM admin_sessions WHERE session_token = $1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async createSession(token) {
    const res = await db.query(
      `INSERT INTO admin_sessions (session_token, status, created_at, last_activity_at)
       VALUES ($1, 'ACTIVE', NOW(), NOW())
       RETURNING *`,
      [token]
    );
    return res.rows[0];
  }

  async touchLastActivity(id) {
    await db.query(
      `UPDATE admin_sessions SET last_activity_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async terminateSession(token) {
    await db.query(
      `UPDATE admin_sessions SET status = 'TERMINATED' WHERE session_token = $1`,
      [token]
    );
  }
}

module.exports = new AdminSessionRepository();
