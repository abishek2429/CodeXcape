const finalPasskeyService = require('../../services/finalPasskeyService');

class FinalPasskeyController {
  async submitFinalPasskey(req, res, next) {
    try {
      const response = await finalPasskeyService.submitFinalPasskey(req.player, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FinalPasskeyController();
