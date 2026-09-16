const playerSessionService = require('../../services/playerSessionService');

class PlayerSessionController {
  async login(req, res, next) {
    try {
      const { teamCode, playerNumber } = req.body;
      if (!teamCode || playerNumber == null) {
        return res.status(400).json({
          status: 400,
          error: 'Bad Request',
          code: 'BAD_REQUEST',
          message: 'teamCode and playerNumber are required',
          timestamp: new Date().toISOString()
        });
      }

      const response = await playerSessionService.login({ teamCode, playerNumber }, req, res);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getCurrentPlayer(req, res, next) {
    try {
      const response = await playerSessionService.getCurrentPlayer(req.playerPrincipal);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getLobbyState(req, res, next) {
    try {
      const response = await playerSessionService.getLobbyState(req.playerPrincipal);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async setReady(req, res, next) {
    try {
      const isReady = req.body == null || req.body.ready == null || req.body.ready === true;
      const response = await playerSessionService.setPlayerReady(req.playerPrincipal, isReady);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async startEvent(req, res, next) {
    try {
      const response = await playerSessionService.startTeamEvent(req.playerPrincipal);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await playerSessionService.logout(req.playerPrincipal, res);
      return res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlayerSessionController();
