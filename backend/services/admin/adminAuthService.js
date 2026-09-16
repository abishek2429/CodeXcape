const { v4: uuidv4 } = require('uuid');
const env = require('../../config/env');
const adminSessionRepository = require('../../repositories/adminSessionRepository');
const adminAuditRepository = require('../../repositories/adminAuditRepository');

class AdminAuthService {
  async login(password) {
    if (!password || password.trim() !== env.ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials');
    }

    const token = uuidv4();
    await adminSessionRepository.createSession(token);
    await adminAuditRepository.log('admin', 'ADMIN', 'LOGIN', 'ADMIN_PORTAL', 'Admin successfully logged in');
    return token;
  }

  async logout(token) {
    if (token) {
      await adminSessionRepository.terminateSession(token);
      await adminAuditRepository.log('admin', 'ADMIN', 'LOGOUT', 'ADMIN_PORTAL', 'Admin logged out');
    }
  }
}

module.exports = new AdminAuthService();
