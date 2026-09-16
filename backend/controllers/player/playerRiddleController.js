const riddleService = require('../../services/riddleService');

class PlayerRiddleController {
  async getRiddleBoardState(req, res, next) {
    try {
      const response = await riddleService.getRiddleBoardState(req.player);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async submitRiddleAnswer(req, res, next) {
    try {
      const response = await riddleService.submitRiddleAnswer(req.player, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlayerRiddleController();
