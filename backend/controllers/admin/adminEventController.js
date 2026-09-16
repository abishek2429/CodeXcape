const eventService = require('../../services/eventService');
const adminEventControlService = require('../../services/admin/adminEventControlService');
const adminDashboardService = require('../../services/admin/adminDashboardService');
const adminAuditService = require('../../services/admin/adminAuditService');

class AdminEventController {
  async createEvent(req, res, next) {
    try {
      const response = await eventService.createEvent(req.body);
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await eventService.getEventById(eventId);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async listEvents(req, res, next) {
    try {
      const response = await eventService.getAllEvents();
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await eventService.updateEvent(eventId, req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateEventStatus(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminEventControlService.updateEventStatus(req.admin, eventId, req.body.status);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async startEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminEventControlService.updateEventStatus(req.admin, eventId, 'RUNNING');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async pauseEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminEventControlService.updateEventStatus(req.admin, eventId, 'PAUSED');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async resumeEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminEventControlService.updateEventStatus(req.admin, eventId, 'RUNNING');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async endEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminEventControlService.updateEventStatus(req.admin, eventId, 'COMPLETED');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async emergencyStop(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const reason = req.body && req.body.reason ? req.body.reason : 'Organizer Emergency Stop Triggered';
      const response = await adminEventControlService.emergencyStop(req.admin, eventId, reason);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updatePasskey(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const passkey = req.body.passkey;
      const response = await adminEventControlService.updateEventPasskey(req.admin, eventId, passkey);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const response = await adminDashboardService.getDashboardStats(eventId);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await adminAuditService.getRecentAuditLogs();
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminEventController();
