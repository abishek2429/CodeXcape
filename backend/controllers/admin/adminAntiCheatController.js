const antiCheatService = require('../../services/antiCheatService');

class AdminAntiCheatController {
  async getEventViolations(req, res, next) {
    try {
      const eventId = parseInt(req.query.eventId, 10);
      const violations = await antiCheatService.getEventViolations(eventId);
      res.json(violations);
    } catch (err) {
      next(err);
    }
  }

  async getEventSummaries(req, res, next) {
    try {
      const eventId = parseInt(req.query.eventId, 10);
      const summaries = await antiCheatService.getEventSummaries(eventId);
      res.json(summaries);
    } catch (err) {
      next(err);
    }
  }

  async getTeamViolations(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const violations = await antiCheatService.getTeamViolations(teamId);
      res.json(violations);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminAntiCheatController();
