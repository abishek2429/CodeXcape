const scoringService = require('../../services/scoringService');

class PlayerScoreController {
  async getMyTeamScore(req, res, next) {
    try {
      const principal = req.player || req.playerPrincipal;
      if (!principal) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const score = await scoringService.getTeamScoreSummary(principal.teamId);
      return res.json(score);
    } catch (err) {
      next(err);
    }
  }

  async getTeamScoreSummary(req, res, next) {
    return this.getMyTeamScore(req, res, next);
  }
}

module.exports = new PlayerScoreController();
