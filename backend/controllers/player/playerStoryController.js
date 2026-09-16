const cinematicStoryService = require('../../services/cinematicStoryService');

class PlayerStoryController {
  async getCurrentStoryState(req, res, next) {
    try {
      if (!req.player) return res.status(401).json({ error: 'Unauthorized' });
      const state = await cinematicStoryService.getCurrentStoryState(req.player.teamId);
      res.json(state);
    } catch (err) {
      next(err);
    }
  }

  async skipStory(req, res, next) {
    try {
      if (!req.player) return res.status(401).json({ error: 'Unauthorized' });
      const state = await cinematicStoryService.skipStory(req.player.teamId, req.player.playerId);
      res.json(state);
    } catch (err) {
      next(err);
    }
  }

  async completeStory(req, res, next) {
    try {
      if (!req.player) return res.status(401).json({ error: 'Unauthorized' });
      const state = await cinematicStoryService.completeStory(req.player.teamId, req.player.playerId);
      res.json(state);
    } catch (err) {
      next(err);
    }
  }

  async replayStory(req, res, next) {
    try {
      if (!req.player) return res.status(401).json({ error: 'Unauthorized' });
      const storyKey = req.query.storyKey || req.body.storyKey;
      const state = await cinematicStoryService.replayStory(req.player.teamId, storyKey);
      res.json(state);
    } catch (err) {
      next(err);
    }
  }

  async getResolvedStories(req, res, next) {
    try {
      if (!req.player) return res.status(401).json({ error: 'Unauthorized' });
      const keys = await cinematicStoryService.getResolvedStoryKeys(req.player.teamId);
      res.json(keys);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlayerStoryController();
