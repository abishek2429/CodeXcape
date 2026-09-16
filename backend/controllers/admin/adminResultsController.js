const leaderboardService = require('../../services/admin/leaderboardService');
const resultExportService = require('../../services/admin/resultExportService');
const scoringService = require('../../services/scoringService');

class AdminResultsController {
  async getLeaderboard(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const leaderboard = await leaderboardService.getLeaderboard(eventId);
      res.json(leaderboard);
    } catch (err) {
      next(err);
    }
  }

  async getTeamScoreSummary(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const summary = await scoringService.getTeamScoreSummary(teamId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }

  async getTeamScoreEvents(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const events = await scoringService.getTeamScoreEvents(teamId);
      res.json(events);
    } catch (err) {
      next(err);
    }
  }

  async getEventStatistics(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const stats = await leaderboardService.getEventStatistics(eventId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async exportResultsCsv(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const csv = await resultExportService.generateEventResultsCsv(req.admin, eventId);
      res.setHeader('Content-Disposition', `attachment; filename="codexcape_event_${eventId}_results.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  async exportProgressCsv(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const csv = await resultExportService.generateTeamProgressCsv(req.admin, eventId);
      res.setHeader('Content-Disposition', `attachment; filename="codexcape_event_${eventId}_progress.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminResultsController();
