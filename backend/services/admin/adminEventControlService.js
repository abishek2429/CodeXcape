const bcrypt = require('bcryptjs');
const eventRepository = require('../../repositories/eventRepository');
const teamRepository = require('../../repositories/teamRepository');
const webSocketPublisher = require('../webSocketService');
const adminAuditService = require('./adminAuditService');
const eventContentValidationService = require('./eventContentValidationService');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class AdminEventControlService {
  async updateEventStatus(principal, eventId, newStatus) {
    this._validateAdminRole(principal);

    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    if (newStatus === 'RUNNING' || newStatus === 'READY') {
      const readiness = await eventContentValidationService.validateEventReadiness(eventId);
      if (!readiness.overallReady) {
        const err = new Error(`Cannot start event. Content validation failed: ${readiness.validationErrors.join('; ')}`);
        err.status = 400;
        throw err;
      }
    }

    const oldStatus = event.status;
    if (oldStatus === newStatus) {
      return this._mapToResponse(event);
    }

    this._validateEventTransition(oldStatus, newStatus);

    const updateData = { status: newStatus };
    if (newStatus === 'RUNNING' && !event.startTime) {
      updateData.startTime = new Date().toISOString();
    }
    if (newStatus === 'COMPLETED' && !event.endTime) {
      updateData.endTime = new Date().toISOString();
    }

    const saved = await eventRepository.update(eventId, updateData);

    await adminAuditService.logAction(
      principal,
      'UPDATE_EVENT_STATUS',
      `Event #${eventId}`,
      `Changed status from ${oldStatus} to ${newStatus}`
    );

    // Notify active teams via WebSocket
    const teams = await teamRepository.findByEventId(eventId);
    let notificationMessage;
    switch (newStatus) {
      case 'PAUSED':
        notificationMessage = 'CODEXCAPE IS PAUSED. Please wait for the organizer.';
        break;
      case 'RUNNING':
        notificationMessage = 'CODEXCAPE RESUMED. Continue your challenge.';
        break;
      case 'COMPLETED':
        notificationMessage = 'CODEXCAPE HAS ENDED. Gameplay is now closed.';
        break;
      default:
        notificationMessage = `Event status updated to ${newStatus}`;
    }

    for (const team of teams) {
      webSocketPublisher.notifyEventStatusChange(team.id, notificationMessage);
    }

    return this._mapToResponse(saved);
  }

  async emergencyStop(principal, eventId, reason) {
    this._validateAdminRole(principal);

    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    const saved = await eventRepository.updateStatus(eventId, 'PAUSED');

    const auditReason = reason && reason.trim() ? reason.trim() : 'Organizer Emergency Stop Triggered';

    await adminAuditService.logAction(
      principal,
      'EMERGENCY_STOP',
      `Event #${eventId}`,
      `Emergency Stop executed: ${auditReason}`
    );

    const teams = await teamRepository.findByEventId(eventId);
    const emergencyAlert = `🚨 EMERGENCY STOP TRIGGERED BY ORGANIZER. Gameplay is paused immediately. Reason: ${auditReason}`;

    for (const team of teams) {
      webSocketPublisher.notifyEventStatusChange(team.id, emergencyAlert);
    }

    return this._mapToResponse(saved);
  }

  async updateEventPasskey(principal, eventId, newPasskey) {
    this._validateAdminRole(principal);

    if (!newPasskey || !newPasskey.trim().match(/^\d{6}$/)) {
      const err = new Error('Passkey must contain exactly 6 digits.');
      err.status = 400;
      throw err;
    }

    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    const hashedPasskey = bcrypt.hashSync(newPasskey.trim(), 10);
    const saved = await eventRepository.updatePasskey(eventId, hashedPasskey);

    await adminAuditService.logAction(
      principal,
      'CHANGE_FINAL_PASSKEY',
      `Event #${eventId}`,
      'Updated final passkey hash'
    );

    return this._mapToResponse(saved);
  }

  _validateEventTransition(from, to) {
    if (from === 'COMPLETED') {
      const err = new Error('Cannot change status of a completed event. Event lifecycle is terminal.');
      err.status = 400;
      throw err;
    }
    let valid = false;
    switch (from) {
      case 'DRAFT':
        valid = (to === 'READY' || to === 'RUNNING');
        break;
      case 'READY':
        valid = (to === 'RUNNING' || to === 'DRAFT');
        break;
      case 'RUNNING':
        valid = (to === 'PAUSED' || to === 'COMPLETED');
        break;
      case 'PAUSED':
        valid = (to === 'RUNNING' || to === 'COMPLETED');
        break;
      case 'COMPLETED':
        valid = false;
        break;
    }
    if (!valid) {
      const err = new Error(`Invalid event transition from ${from} to ${to}.`);
      err.status = 400;
      throw err;
    }
  }

  _validateAdminRole(principal) {
    if (!principal || (principal.role !== 'ADMIN' && principal.role !== 'ORGANIZER')) {
      const err = new Error('Unauthorized administrative access.');
      err.status = 403;
      throw err;
    }
  }

  _mapToResponse(event) {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }
}

module.exports = new AdminEventControlService();
