const db = require('../config/db');

class HealthService {
  async checkHealth() {
    let dbStatus = 'UP';
    try {
      const res = await db.query('SELECT 1');
      if (!res || res.rows.length === 0) {
        dbStatus = 'DOWN';
      }
    } catch (e) {
      dbStatus = 'DOWN';
    }

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'technical-escape-room-backend',
      database: dbStatus,
      version: '1.0.0'
    };
  }
}

module.exports = new HealthService();
