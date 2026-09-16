const antiCheatService = require('../../services/antiCheatService');

class AntiCheatController {
  async reportEvent(req, res, next) {
    try {
      const response = await antiCheatService.processPlayerEvent(req.player, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getTeamSummary(req, res, next) {
    try {
      if (!req.player) {
        return res.status(404).json({ error: 'Player session not found' });
      }
      const summary = await antiCheatService.getTeamSummary(req.player.teamId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AntiCheatController();
