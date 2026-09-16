const adminAuditRepository = require('../../repositories/adminAuditRepository');

class AdminAuditService {
  async logAction(principal, action, target, details) {
    const username = (principal && principal.username) ? principal.username : 'SYSTEM';
    const role = (principal && principal.role) ? principal.role : 'ORGANIZER';
    await adminAuditRepository.log(username, role, action, target, details);
  }

  async getRecentAuditLogs(limit = 50) {
    return await adminAuditRepository.findRecent(limit);
  }
}

module.exports = new AdminAuditService();
