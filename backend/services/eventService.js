const eventRepository = require('../repositories/eventRepository');
const teamRepository = require('../repositories/teamRepository');
const auditService = require('./auditService');
const { ResourceNotFoundException } = require('../middleware/errorHandler');

class EventService {
  async createEvent(request) {
    this._validateTimestamps(request.startTime, request.endTime);

    const rawPasskey = (request.passkey && request.passkey.trim())
      ? request.passkey.trim()
      : this._generateRandomPasskey();

    const passkeyHash = "HASH_" + this._hashCode(rawPasskey).toString(16);

    const event = await eventRepository.create({
      name: (request.name || '').trim(),
      description: request.description || '',
      status: 'DRAFT',
      passkeyHash,
      startTime: request.startTime || null,
      endTime: request.endTime || null
    });

    await auditService.logEvent(
      'EVENT_CREATED',
      event,
      null,
      null,
      JSON.stringify({ name: event.name }),
      'ADMIN'
    );

    return await this._mapToResponse(event);
  }

  async getEventById(eventId) {
    const event = await this.findEventOrThrow(eventId);
    return await this._mapToResponse(event);
  }

  async getAllEvents() {
    const events = await eventRepository.findAll();
    const responses = [];
    for (const ev of events) {
      responses.push(await this._mapToResponse(ev));
    }
    return responses;
  }

  async updateEvent(eventId, request) {
    this._validateTimestamps(request.startTime, request.endTime);

    const event = await this.findEventOrThrow(eventId);
    const updated = await eventRepository.update(eventId, {
      name: (request.name || event.name).trim(),
      description: request.description !== undefined ? request.description : event.description,
      status: request.status || event.status,
      startTime: request.startTime !== undefined ? request.startTime : event.startTime,
      endTime: request.endTime !== undefined ? request.endTime : event.endTime
    });

    await auditService.logEvent(
      'EVENT_UPDATED',
      updated,
      null,
      null,
      JSON.stringify({ status: updated.status }),
      'ADMIN'
    );

    return await this._mapToResponse(updated);
  }

  async updateEventStatus(eventId, status) {
    const event = await this.findEventOrThrow(eventId);
    const updated = await eventRepository.updateStatus(eventId, status);

    await auditService.logEvent(
      'EVENT_STATUS_CHANGED',
      updated,
      null,
      null,
      JSON.stringify({ newStatus: status }),
      'ADMIN'
    );

    return await this._mapToResponse(updated);
  }

  async findEventOrThrow(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found with ID: ${eventId}`);
    }
    return event;
  }

  _validateTimestamps(startTime, endTime) {
    if (startTime && endTime && new Date(endTime) < new Date(startTime)) {
      const err = new Error('Event end time cannot be before start time');
      err.status = 400;
      throw err;
    }
  }

  _generateRandomPasskey() {
    return String(100000 + Math.floor(Math.random() * 900000));
  }

  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  async _mapToResponse(event) {
    const teamCount = await teamRepository.countByEventId(event.id);
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      status: event.status,
      startTime: event.startTime,
      endTime: event.endTime,
      teamCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }
}

module.exports = new EventService();
