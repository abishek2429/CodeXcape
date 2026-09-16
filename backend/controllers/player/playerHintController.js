const hintService = require('../../services/hintService');

class PlayerHintController {
  async getPlayerHints(req, res, next) {
    try {
      const response = await hintService.getHintsForPlayer(req.player);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async useHint(req, res, next) {
    try {
      const levelNumber = parseInt(req.params.levelNumber, 10);
      const stageNumber = parseInt(req.params.stageNumber, 10);
      const hintNumber = parseInt(req.params.hintNumber, 10);
      const response = await hintService.useHint(req.player, levelNumber, stageNumber, hintNumber);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlayerHintController();
