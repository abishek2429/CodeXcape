const gameStateService = require('../../services/gameStateService');

class PlayerGameStateController {
  async getPlayerGameState(req, res, next) {
    try {
      const state = await gameStateService.getGameStateForPlayer(req.player);
      return res.json(state);
    } catch (err) {
      next(err);
    }
  }

  async getCurrentLevel(req, res, next) {
    try {
      const currentLevel = await gameStateService.getCurrentLevelForPlayer(req.player);
      return res.json(currentLevel);
    } catch (err) {
      next(err);
    }
  }

  async getFullResyncState(req, res, next) {
    try {
      const state = await gameStateService.getFullResyncStateForPlayer(req.player);
      return res.json(state);
    } catch (err) {
      next(err);
    }
  }

  // Aliases for compatibility
  async getGameState(req, res, next) {
    return this.getPlayerGameState(req, res, next);
  }

  async resyncGameState(req, res, next) {
    return this.getFullResyncState(req, res, next);
  }
}

module.exports = new PlayerGameStateController();
