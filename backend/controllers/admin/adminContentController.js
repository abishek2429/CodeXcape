const adminContentService = require('../../services/admin/adminContentService');
const eventContentValidationService = require('../../services/admin/eventContentValidationService');

class AdminContentController {
  async getAllContent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const content = await adminContentService.getAllContentForEvent(eventId);
      res.json(content);
    } catch (err) {
      next(err);
    }
  }

  async validateEventReadiness(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const readiness = await eventContentValidationService.validateEventReadiness(eventId);
      res.json(readiness);
    } catch (err) {
      next(err);
    }
  }

  async saveQuestion(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const levelNumber = parseInt(req.params.levelNumber, 10);
      const response = await adminContentService.saveQuestionConfig(req.admin, eventId, levelNumber, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async saveHint(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const levelNumber = parseInt(req.params.levelNumber, 10);
      const response = await adminContentService.saveHintConfig(req.admin, eventId, levelNumber, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async testAnswer(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminContentService.testAnswer(req.admin, eventId, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getPlayerSafePreview(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const levelNumber = parseInt(req.query.levelNumber, 10);
      const playerNumber = parseInt(req.query.playerNumber, 10);
      const preview = await adminContentService.getPlayerSafePreview(eventId, levelNumber, playerNumber);
      res.json(preview);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminContentController();
