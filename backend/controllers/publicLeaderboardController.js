const leaderboardService = require('../services/admin/leaderboardService');

class PublicLeaderboardController {
  async getPublicLeaderboard(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const dto = await leaderboardService.getPublicLeaderboard(eventId);
      res.json(dto);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PublicLeaderboardController();
