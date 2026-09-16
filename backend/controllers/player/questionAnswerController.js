const questionAnswerService = require('../../services/questionAnswerService');

class QuestionAnswerController {
  async getCurrentQuestion(req, res, next) {
    try {
      const q = await questionAnswerService.getCurrentQuestionForPlayer(req.playerPrincipal);
      return res.json(q);
    } catch (err) {
      next(err);
    }
  }

  async submitAnswer(req, res, next) {
    try {
      const response = await questionAnswerService.submitAnswer(req.playerPrincipal, req.body);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QuestionAnswerController();
