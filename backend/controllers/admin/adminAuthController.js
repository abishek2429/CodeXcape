const adminAuthService = require('../../services/admin/adminAuthService');
const { extractAdminToken } = require('../../middleware/authMiddleware');

class AdminAuthController {
  async login(req, res, next) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const token = await adminAuthService.login(password);

      res.cookie('ADMIN_SESSION', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.json({
        message: 'Login successful',
        token,
        sessionToken: token
      });
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  }

  async logout(req, res, next) {
    try {
      const token = extractAdminToken(req);
      if (token) {
        await adminAuthService.logout(token);
      }

      res.cookie('ADMIN_SESSION', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0,
        path: '/'
      });

      return res.json({ message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminAuthController();
