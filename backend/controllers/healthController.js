const healthService = require('../services/healthService');

class HealthController {
  async getHealth(req, res, next) {
    try {
      const response = await healthService.checkHealth();
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HealthController();
