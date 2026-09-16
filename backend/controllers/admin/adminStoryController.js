const storylineService = require('../../services/storylineService');

class AdminStoryController {
  async getTeamStoryProgress(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const storyline = await storylineService.getStorylineForTeamAdmin(teamId);
      res.json(storyline);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminStoryController();
