const db = require('../config/db');

class AdminAuditRepository {
  async log(adminUsername, role, action, target, details) {
    try {
      await db.query(
        `INSERT INTO admin_audit_logs (admin_username, role, action, target, details, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [adminUsername, role || 'ADMIN', action, target, typeof details === 'object' ? JSON.stringify(details) : details]
      );
    } catch (e) {
      console.warn('Failed to insert admin audit log', e.message);
    }
  }

  async findRecent(limit = 100) {
    const res = await db.query(
      `SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows.map(row => ({
      id: parseInt(row.id, 10),
      adminUsername: row.admin_username,
      role: row.role,
      action: row.action,
      target: row.target,
      details: row.details,
      createdAt: row.created_at
    }));
  }
}

module.exports = new AdminAuditRepository();
