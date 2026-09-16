const eventRepository = require('../repositories/eventRepository');
const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const gameStateService = require('./gameStateService');
const auditService = require('./auditService');
const { ResourceNotFoundException } = require('../middleware/errorHandler');

class TeamService {
  async createTeam(eventId, request) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found with ID: ${eventId}`);
    }

    if (!request.player1DisplayName || !request.player1DisplayName.trim()) {
      const err = new Error('Player 1 display name is required');
      err.status = 400;
      throw err;
    }
    if (!request.player2DisplayName || !request.player2DisplayName.trim()) {
      const err = new Error('Player 2 display name is required');
      err.status = 400;
      throw err;
    }

    let teamCode;
    if (request.customTeamCode && request.customTeamCode.trim()) {
      teamCode = request.customTeamCode.trim().toUpperCase();
      const existing = await teamRepository.findByEventIdAndTeamCode(eventId, teamCode);
      if (existing) {
        const err = new Error(`Team code '${teamCode}' already exists for this event`);
        err.status = 400;
        throw err;
      }
    } else {
      const currentCount = await teamRepository.countByEventId(eventId);
      teamCode = await this._generateUniqueTeamCode(eventId, currentCount);
    }

    const team = await teamRepository.createTeam({
      eventId: event.id,
      teamCode,
      teamName: (request.teamName || teamCode).trim(),
      status: 'REGISTERED',
      gameState: 'NOT_STARTED'
    });

    const p1 = await playerRepository.create({
      teamId: team.id,
      playerNumber: 1,
      displayName: request.player1DisplayName.trim(),
      status: 'INACTIVE'
    });

    const p2 = await playerRepository.create({
      teamId: team.id,
      playerNumber: 2,
      displayName: request.player2DisplayName.trim(),
      status: 'INACTIVE'
    });

    const fullTeam = await teamRepository.findById(team.id);
    await gameStateService.initializeTeamGameState(fullTeam);

    await auditService.logEvent(
      'TEAM_CREATED',
      event,
      fullTeam,
      null,
      JSON.stringify({ teamCode, teamName: fullTeam.teamName }),
      'ADMIN'
    );

    return await this._mapToDetailResponse(fullTeam);
  }

  async getTeamById(teamId) {
    const team = await this.findTeamOrThrow(teamId);
    return await this._mapToDetailResponse(team);
  }

  async getTeamsByEventId(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found with ID: ${eventId}`);
    }

    const teams = await teamRepository.findByEventId(eventId);
    const result = [];
    for (const team of teams) {
      result.push(await this._mapToResponse(team));
    }
    return result;
  }

  async updateTeam(teamId, request) {
    const team = await this.findTeamOrThrow(teamId);

    if (request.teamName) team.teamName = request.teamName.trim();
    if (request.status) team.status = request.status;

    const players = await playerRepository.findByTeamId(teamId);
    for (const p of players) {
      if (p.playerNumber === 1 && request.player1DisplayName) {
        p.displayName = request.player1DisplayName.trim();
        await playerRepository.save(p);
      } else if (p.playerNumber === 2 && request.player2DisplayName) {
        p.displayName = request.player2DisplayName.trim();
        await playerRepository.save(p);
      }
    }

    const updatedTeam = await teamRepository.save(team);

    await auditService.logEvent(
      'TEAM_UPDATED',
      updatedTeam.event,
      updatedTeam,
      null,
      JSON.stringify({ status: updatedTeam.status }),
      'ADMIN'
    );

    return await this._mapToDetailResponse(updatedTeam);
  }

  async updateTeamStatus(teamId, status) {
    const team = await this.findTeamOrThrow(teamId);
    team.status = status;

    const updatedTeam = await teamRepository.save(team);

    const auditType = (status === 'ACTIVE') ? 'TEAM_ACTIVATED' : 'TEAM_STATUS_CHANGED';
    await auditService.logEvent(
      auditType,
      updatedTeam.event,
      updatedTeam,
      null,
      JSON.stringify({ newStatus: status }),
      'ADMIN'
    );

    return await this._mapToDetailResponse(updatedTeam);
  }

  async deleteTeam(teamId) {
    const team = await this.findTeamOrThrow(teamId);

    await auditService.logEvent(
      'TEAM_DELETED',
      team.event,
      team,
      null,
      JSON.stringify({ deletedTeamCode: team.teamCode }),
      'ADMIN'
    );

    await playerRepository.deleteByTeamId(teamId);
    await teamRepository.deleteById(teamId);
  }

  async findTeamOrThrow(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new ResourceNotFoundException(`Team not found with ID: ${teamId}`);
    }
    return team;
  }

  async _generateUniqueTeamCode(eventId, currentCount) {
    let index = currentCount + 1;
    while (true) {
      const code = `TEAM-${String(index).padStart(3, '0')}`;
      const existing = await teamRepository.findByEventIdAndTeamCode(eventId, code);
      if (!existing) {
        return code;
      }
      index++;
    }
  }

  async _mapToResponse(team) {
    const players = await playerRepository.findByTeamId(team.id);
    const p1 = players.find(p => p.playerNumber === 1);
    const p2 = players.find(p => p.playerNumber === 2);

    return {
      id: team.id,
      eventId: team.eventId,
      teamCode: team.teamCode,
      teamName: team.teamName,
      status: team.status,
      player1DisplayName: p1 ? p1.displayName : '',
      player2DisplayName: p2 ? p2.displayName : '',
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };
  }

  async _mapToDetailResponse(team) {
    const players = await playerRepository.findByTeamId(team.id);
    const playerDtos = players.map(p => ({
      id: p.id,
      playerNumber: p.playerNumber,
      displayName: p.displayName,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return {
      id: team.id,
      eventId: team.eventId,
      eventName: team.event ? team.event.name : null,
      teamCode: team.teamCode,
      teamName: team.teamName,
      status: team.status,
      completedAt: team.completedAt,
      players: playerDtos,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };
  }
}

module.exports = new TeamService();
