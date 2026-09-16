const teamService = require('../../services/teamService');
const teamExcelImportService = require('../../services/admin/teamExcelImportService');
const adminDashboardService = require('../../services/admin/adminDashboardService');
const adminTeamResetService = require('../../services/admin/adminTeamResetService');
const playerSessionService = require('../../services/playerSessionService');

class AdminTeamController {
  async createTeam(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await teamService.createTeam(eventId, req.body);
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const response = await teamService.getTeamById(teamId);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async listTeamsForEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await teamService.getTeamsByEventId(eventId);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const response = await teamService.updateTeam(teamId, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateTeamStatus(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const response = await teamService.updateTeamStatus(teamId, req.body.status);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getTeamsProgress(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const search = req.query.search;
      const level = req.query.level ? parseInt(req.query.level, 10) : null;
      const status = req.query.status;
      const response = await adminDashboardService.getTeamsProgress(eventId, search, level, status);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async resetTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      await adminTeamResetService.resetTeamProgress(req.admin, teamId);
      res.json({ message: 'Team reset successfully' });
    } catch (err) {
      next(err);
    }
  }

  async pauseTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const response = await teamService.updateTeamStatus(teamId, 'REGISTERED');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async resumeTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const response = await teamService.updateTeamStatus(teamId, 'REGISTERED');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      await playerSessionService.revokeSession(req.admin, sessionId);
      res.json({ message: 'Session revoked' });
    } catch (err) {
      next(err);
    }
  }

  async getActiveSessions(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminDashboardService.getActiveSessions(eventId);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async resetTeamCredentials(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      await playerSessionService.resetTeamCredentialsAndSessions(req.admin, teamId);
      res.json({ message: 'Team credentials and sessions reset' });
    } catch (err) {
      next(err);
    }
  }

  async revokeTeamSessions(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      await playerSessionService.revokeAllTeamSessions(req.admin, teamId);
      res.json({ message: 'Team sessions revoked' });
    } catch (err) {
      next(err);
    }
  }

  async resetAllSessions(req, res, next) {
    try {
      await playerSessionService.resetAllSessionsAndCredentials(req.admin);
      res.json({ message: 'All sessions reset' });
    } catch (err) {
      next(err);
    }
  }

  async deleteTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      await teamService.deleteTeam(teamId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async previewExcelImport(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const preview = await teamExcelImportService.parseAndValidate(eventId, req.file.buffer, req.file.originalname);
      res.json(preview);
    } catch (err) {
      next(err);
    }
  }

  async confirmExcelImport(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await teamExcelImportService.importTeams(eventId, req.file.buffer, req.file.originalname, req.admin);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminTeamController();
