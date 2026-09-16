const { v4: uuidv4 } = require('uuid');
const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const gameSessionRepository = require('../repositories/gameSessionRepository');
const auditService = require('./auditService');
const webSocketService = require('./webSocketService');
const {
  ResourceNotFoundException,
  AccountDisabledException,
  EventUnavailableException
} = require('../middleware/errorHandler');

class PlayerSessionService {
  async resolveTeam(rawCode, normalizedCode) {
    let team = await teamRepository.findByTeamCode(normalizedCode);
    if (!team) {
      team = await teamRepository.findByTeamCode(rawCode);
    }
    if (!team && !normalizedCode.startsWith('TEAM-')) {
      team = await teamRepository.findByTeamCode('TEAM-' + normalizedCode);
    }
    return team;
  }

  async login({ teamCode, playerNumber }, req, res) {
    const rawCode = teamCode ? teamCode.trim().toUpperCase() : '';
    const normalizedTeamCode = rawCode.replace(/\s+/g, '-');

    // 1. Resolve Team
    const team = await this.resolveTeam(rawCode, normalizedTeamCode);
    if (!team) {
      await auditService.logEvent(
        'PLAYER_LOGIN_FAILED',
        null,
        null,
        null,
        { reason: 'Team code not found', teamCode: rawCode },
        'PLAYER'
      );
      throw new ResourceNotFoundException('Team not found.');
    }

    // 2. Validate Event
    const event = team.event;
    if (!event || (event.status !== 'READY' && event.status !== 'RUNNING')) {
      await auditService.logEvent(
        'PLAYER_LOGIN_FAILED',
        event,
        team,
        null,
        { reason: 'Event not accepting players', status: event ? event.status : null },
        'PLAYER'
      );
      throw new EventUnavailableException('The event is not currently accepting players.');
    }

    // 3. Validate Team Status
    if (team.status === 'DISQUALIFIED' || team.status === 'COMPLETED') {
      await auditService.logEvent(
        'PLAYER_LOGIN_FAILED',
        event,
        team,
        null,
        { reason: 'Team is not active', status: team.status },
        'PLAYER'
      );
      throw new EventUnavailableException('The event is not currently accepting players.');
    }

    // 4. Resolve Player
    const playerNum = parseInt(playerNumber, 10);
    const player = await playerRepository.findByTeamIdAndPlayerNumber(team.id, playerNum);
    if (!player) {
      await auditService.logEvent(
        'PLAYER_LOGIN_FAILED',
        event,
        team,
        null,
        { reason: 'Player number not found', playerNumber: playerNum },
        'PLAYER'
      );
      throw new ResourceNotFoundException('Selected player is not registered for this team.');
    }

    if (player.is_active === false) {
      await auditService.logEvent(
        'PLAYER_LOGIN_FAILED',
        event,
        team,
        player,
        { reason: 'Player account is deactivated or ineligible' },
        'PLAYER'
      );
      throw new AccountDisabledException('Player account is deactivated or ineligible.');
    }

    // 5. Active Sessions Handling & Clean Rotation
    const activeSessions = await gameSessionRepository.findAllByPlayerIdAndStatus(player.id, 'ACTIVE');
    const existingToken = req.headers['x-player-session'] || (req.cookies && req.cookies['PLAYER_SESSION']);

    if (activeSessions.length > 0) {
      for (const activeSession of activeSessions) {
        if (existingToken && existingToken === activeSession.session_token) {
          // Reconnection
          await gameSessionRepository.touchLastActivity(activeSession.id);
          await playerRepository.updateStatus(player.id, 'CONNECTED');
          this.setSessionCookie(res, activeSession.session_token);
          webSocketService.notifyPlayerConnection(team.id, player.id, player.player_number, player.display_name, true);
          return this.mapToResponse(team, player, activeSession.session_token);
        } else {
          // Rotate prior session cleanly
          await gameSessionRepository.updateStatus(activeSession.id, 'TERMINATED', false);
        }
      }
    }

    // 6. Create fresh GameSession
    const newToken = uuidv4();
    await gameSessionRepository.createSession(team.id, player.id, newToken);
    await playerRepository.updateStatus(player.id, 'CONNECTED');

    await auditService.logEvent(
      'PLAYER_LOGIN_SUCCESS',
      event,
      team,
      player,
      { sessionToken: newToken },
      'PLAYER'
    );

    this.setSessionCookie(res, newToken);
    webSocketService.notifyPlayerConnection(team.id, player.id, player.player_number, player.display_name, true);

    return this.mapToResponse(team, player, newToken);
  }

  async getCurrentPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player found.');
    const team = await teamRepository.findById(principal.teamId);
    const player = await playerRepository.findById(principal.playerId);
    return this.mapToResponse(team, player, principal.sessionToken);
  }

  async getLobbyState(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player found.');
    const team = await teamRepository.findById(principal.teamId);
    const player = await playerRepository.findById(principal.playerId);
    const teammates = await playerRepository.findByTeamId(team.id);

    return {
      ...this.mapToResponse(team, player, principal.sessionToken),
      players: teammates.map(p => ({
        id: p.id,
        playerNumber: p.player_number,
        displayName: p.display_name,
        status: p.status,
        ready: p.status === 'CONNECTED'
      }))
    };
  }

  async setPlayerReady(principal, isReady) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player found.');
    const player = await playerRepository.updateReady(principal.playerId, isReady);
    const team = await teamRepository.findById(principal.teamId);
    return this.mapToResponse(team, player, principal.sessionToken);
  }

  async startTeamEvent(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const gameStateService = require('./gameStateService');
    await gameStateService.initializeTeamGameState(team);

    team.gameState = 'IN_PROGRESS';
    if (!team.startedAt) {
      team.startedAt = new Date().toISOString();
    }
    await teamRepository.save(team);

    webSocketService.notifyEventStarted(team.id);

    const player = await playerRepository.findById(principal.playerId);
    return this.mapToResponse(team, player, principal.sessionToken);
  }

  async logout(principal, res) {
    if (principal) {
      await gameSessionRepository.terminateByPlayerId(principal.playerId);
      await playerRepository.updateStatus(principal.playerId, 'DISCONNECTED');
      webSocketService.notifyPlayerConnection(principal.teamId, principal.playerId, principal.playerNumber, principal.displayName, false);
    }
    if (res) {
      res.cookie('PLAYER_SESSION', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0,
        path: '/'
      });
    }
  }

  setSessionCookie(res, token) {
    if (!res) return;
    res.cookie('PLAYER_SESSION', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000,
      path: '/'
    });
  }

  mapToResponse(team, player, sessionToken) {
    return {
      playerId: player.id,
      playerNumber: player.player_number,
      displayName: player.display_name,
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      eventId: team.eventId,
      status: player.status,
      teamStatus: team.status,
      gameState: team.gameState,
      sessionToken,
      startedAt: team.startedAt,
      completedAt: team.completedAt
    };
  }

  // Admin session maintenance
  async revokeSession(adminPrincipal, sessionId) {
    await gameSessionRepository.terminateById(sessionId);
  }

  async resetTeamCredentialsAndSessions(adminPrincipal, teamId) {
    await gameSessionRepository.terminateByTeamId(teamId);
  }

  async revokeAllTeamSessions(adminPrincipal, teamId) {
    await gameSessionRepository.terminateByTeamId(teamId);
  }

  async resetAllSessionsAndCredentials(adminPrincipal) {
    await gameSessionRepository.terminateAll();
  }
}

module.exports = new PlayerSessionService();
