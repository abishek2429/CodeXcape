const storylineService = require('../../services/storylineService');

class StorylineController {
  async getStoryline(req, res, next) {
    try {
      const storyline = await storylineService.getStorylineForPlayer(req.player);
      res.json(storyline);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StorylineController();
