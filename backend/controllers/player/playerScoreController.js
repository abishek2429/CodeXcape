const scoringService = require('../../services/scoringService');

class PlayerScoreController {
  async getMyTeamScore(req, res, next) {
    try {
      if (!req.playerPrincipal) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const score = await scoringService.getTeamScoreSummary(req.playerPrincipal.teamId);
      return res.json(score);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlayerScoreController();
