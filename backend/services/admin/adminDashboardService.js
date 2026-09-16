const eventRepository = require('../../repositories/eventRepository');
const teamRepository = require('../../repositories/teamRepository');
const playerRepository = require('../../repositories/playerRepository');
const teamLevelProgressRepository = require('../../repositories/teamLevelProgressRepository');
const gameSessionRepository = require('../../repositories/gameSessionRepository');
const webSocketPublisher = require('../webSocketService');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class AdminDashboardService {
  async getDashboardStats(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    const teams = await teamRepository.findByEventId(eventId);
    const totalTeams = teams.length;
    const completedTeams = teams.filter(t => t.gameState === 'COMPLETED').length;
    const activeTeams = totalTeams - completedTeams;

    let bothOnline = 0;
    let oneOffline = 0;
    let bothOffline = 0;
    let disconnectedCount = 0;
    let totalLoggedInTeams = 0;
    let totalActiveSessions = 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    if (teams.length > 0) {
      const allPlayers = [];
      const playersByTeam = new Map();
      for (const t of teams) {
        const pList = await playerRepository.findByTeamId(t.id);
        playersByTeam.set(t.id, pList);
        allPlayers.push(...pList);
      }

      const playerIds = allPlayers.map(p => p.id);
      const activeSessions = await gameSessionRepository.findByPlayerIdInAndStatus(playerIds, 'ACTIVE');
      const activeSessionsByPlayer = new Map();
      for (const s of activeSessions) {
        if (!activeSessionsByPlayer.has(s.playerId)) {
          activeSessionsByPlayer.set(s.playerId, s);
        }
      }

      for (const team of teams) {
        const players = playersByTeam.get(team.id) || [];
        const p1 = players.find(p => p.playerNumber === 1);
        const p2 = players.find(p => p.playerNumber === 2);

        const s1 = p1 ? activeSessionsByPlayer.get(p1.id) : null;
        const s2 = p2 ? activeSessionsByPlayer.get(p2.id) : null;

        const p1LoggedIn = Boolean(s1);
        const p2LoggedIn = Boolean(s2);
        if (p1LoggedIn) totalActiveSessions++;
        if (p2LoggedIn) totalActiveSessions++;
        if (p1LoggedIn || p2LoggedIn) totalLoggedInTeams++;

        const p1Connected = p1LoggedIn && Boolean(s1.isConnected);
        const p2Connected = p2LoggedIn && Boolean(s2.isConnected);

        if (p1 && !p1Connected) disconnectedCount++;
        if (p2 && !p2Connected) disconnectedCount++;

        if (p1Connected && p2Connected) {
          bothOnline++;
        } else if (!p1Connected && !p2Connected) {
          bothOffline++;
        } else {
          oneOffline++;
        }

        const progressList = await teamLevelProgressRepository.findByTeamId(team.id);
        const activeProgress = progressList.find(
          p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
        );

        if (activeProgress) {
          const lvl = activeProgress.levelNumber || (activeProgress.level && activeProgress.level.levelNumber) || 1;
          distribution[lvl] = (distribution[lvl] || 0) + 1;
        } else if (team.gameState === 'FINAL_PASSKEY') {
          distribution[6] = (distribution[6] || 0) + 1;
        }
      }
    }

    let durationSeconds = null;
    if (event.startTime) {
      const endOrNow = event.endTime ? new Date(event.endTime).getTime() : Date.now();
      durationSeconds = Math.max(0, Math.floor((endOrNow - new Date(event.startTime).getTime()) / 1000));
    }

    return {
      eventId: event.id,
      eventName: event.name,
      eventStatus: event.status,
      totalTeams,
      activeTeams,
      completedTeams,
      disconnectedPlayers: disconnectedCount,
      bothPlayersOnlineTeams: bothOnline,
      onePlayerOfflineTeams: oneOffline,
      bothPlayersOfflineTeams: bothOffline,
      totalLoggedInTeams,
      totalActiveSessions,
      activeWebSocketConnections: webSocketPublisher.getActiveConnectionCount(),
      serverStatus: 'ONLINE',
      eventDurationSeconds: durationSeconds,
      startTime: event.startTime,
      endTime: event.endTime,
      levelDistribution: distribution
    };
  }

  async getActiveSessions(eventId) {
    const teams = await teamRepository.findByEventId(eventId);
    if (!teams || teams.length === 0) return [];

    const allPlayers = [];
    const playersByTeam = new Map();
    for (const t of teams) {
      const pList = await playerRepository.findByTeamId(t.id);
      playersByTeam.set(t.id, pList);
      allPlayers.push(...pList);
    }

    const playerIds = allPlayers.map(p => p.id);
    const activeSessions = await gameSessionRepository.findByPlayerIdInAndStatus(playerIds, 'ACTIVE');
    const activeSessionsByPlayer = new Map();
    for (const s of activeSessions) {
      if (!activeSessionsByPlayer.has(s.playerId)) {
        activeSessionsByPlayer.set(s.playerId, s);
      }
    }

    const sessionDtos = [];
    for (const team of teams) {
      const players = playersByTeam.get(team.id) || [];
      for (const player of players) {
        const session = activeSessionsByPlayer.get(player.id);
        if (session) {
          const token = session.sessionToken;
          const preview = token && token.length > 8 ? token.substring(0, 8) + '...' : token;

          sessionDtos.push({
            sessionId: session.id,
            teamId: team.id,
            teamCode: team.teamCode,
            teamName: team.teamName,
            playerId: player.id,
            playerNumber: player.playerNumber,
            playerName: player.displayName,
            playerRole: player.playerNumber === 1 ? 'OPERATOR' : 'ANALYZER',
            playerStatus: player.status,
            isReady: player.status === 'CONNECTED',
            sessionToken: token,
            sessionTokenPreview: preview,
            sessionStatus: session.status,
            isConnected: session.isConnected,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt,
            teamGameState: team.gameState
          });
        }
      }
    }

    return sessionDtos;
  }

  async getTeamsProgress(eventId, search, levelFilter, statusFilter) {
    const teams = await teamRepository.findByEventId(eventId);
    if (!teams || teams.length === 0) return [];

    const allPlayers = [];
    const playersByTeam = new Map();
    for (const t of teams) {
      const pList = await playerRepository.findByTeamId(t.id);
      playersByTeam.set(t.id, pList);
      allPlayers.push(...pList);
    }

    const playerIds = allPlayers.map(p => p.id);
    const activeSessions = await gameSessionRepository.findByPlayerIdInAndStatus(playerIds, 'ACTIVE');
    const activeSessionsByPlayer = new Map();
    for (const s of activeSessions) {
      if (!activeSessionsByPlayer.has(s.playerId)) {
        activeSessionsByPlayer.set(s.playerId, s);
      }
    }

    const dtos = [];

    for (const team of teams) {
      const players = playersByTeam.get(team.id) || [];
      const p1 = players.find(p => p.playerNumber === 1);
      const p2 = players.find(p => p.playerNumber === 2);

      const s1 = p1 ? activeSessionsByPlayer.get(p1.id) : null;
      const s2 = p2 ? activeSessionsByPlayer.get(p2.id) : null;

      const p1LoggedIn = Boolean(s1);
      const p2LoggedIn = Boolean(s2);
      const activeSessionsCount = (p1LoggedIn ? 1 : 0) + (p2LoggedIn ? 1 : 0);
      const teamSessionActive = activeSessionsCount > 0;

      const p1Online = p1LoggedIn && Boolean(s1.isConnected);
      const p2Online = p2LoggedIn && Boolean(s2.isConnected);

      let connStatus;
      if (p1Online && p2Online) {
        connStatus = 'BOTH_ONLINE';
      } else if (p1Online || p2Online) {
        connStatus = 'ONE_ONLINE';
      } else if (p1LoggedIn || p2LoggedIn) {
        connStatus = 'WAITING';
      } else {
        connStatus = 'OFFLINE';
      }

      if (search && search.trim()) {
        const term = search.toLowerCase().trim();
        const matches = team.teamName.toLowerCase().includes(term) ||
          team.teamCode.toLowerCase().includes(term) ||
          (p1 && p1.displayName.toLowerCase().includes(term)) ||
          (p2 && p2.displayName.toLowerCase().includes(term));
        if (!matches) continue;
      }

      const progressList = await teamLevelProgressRepository.findByTeamId(team.id);
      const activeProgress = progressList.find(
        p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
      );

      const currentLevelNum = activeProgress
        ? (activeProgress.levelNumber || (activeProgress.level && activeProgress.level.levelNumber) || 1)
        : (team.gameState === 'COMPLETED' ? 6 : 1);

      if (levelFilter != null && levelFilter !== currentLevelNum) {
        continue;
      }

      if (statusFilter && statusFilter.trim() && statusFilter.toUpperCase() !== 'ALL') {
        const filterUpper = statusFilter.toUpperCase().trim();
        if (filterUpper === 'COMPLETED' && team.gameState !== 'COMPLETED') continue;
        if (filterUpper === 'IN_PROGRESS' && team.gameState === 'COMPLETED') continue;
        if (filterUpper === 'ONLINE' && connStatus !== 'BOTH_ONLINE') continue;
        if (filterUpper === 'OFFLINE' && connStatus !== 'OFFLINE') continue;
        if (filterUpper === 'LOGGED_IN' && !teamSessionActive) continue;
      }

      const hintsUnlocked = progressList.filter(p => p.levelStatus === 'COMPLETED').length;

      dtos.push({
        teamId: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        status: team.status,
        gameState: team.gameState,
        currentLevel: currentLevelNum,
        player1Completed: activeProgress ? activeProgress.player1Completed : true,
        player2Completed: activeProgress ? activeProgress.player2Completed : true,
        player1Name: p1 ? p1.displayName : 'Player 1',
        player2Name: p2 ? p2.displayName : 'Player 2',
        player1Connected: p1Online,
        player2Connected: p2Online,
        connectionStatus: connStatus,
        player1SessionId: s1 ? s1.id : null,
        player2SessionId: s2 ? s2.id : null,
        hintsUnlocked,
        completedAt: team.completedAt,
        isLoggedIn: teamSessionActive,
        activeSessionsCount,
        teamSessionActive,
        player1Status: p1 ? p1.status : null,
        player1LoggedIn: p1LoggedIn,
        player1Ready: p1 && p1.status === 'CONNECTED',
        player1SessionToken: s1 ? (s1.sessionToken.length > 8 ? s1.sessionToken.substring(0, 8) + '...' : s1.sessionToken) : null,
        player1LoginTime: s1 ? s1.createdAt : null,
        player1LastActivity: s1 ? s1.lastActivityAt : null,
        player2Status: p2 ? p2.status : null,
        player2LoggedIn: p2LoggedIn,
        player2Ready: p2 && p2.status === 'CONNECTED',
        player2SessionToken: s2 ? (s2.sessionToken.length > 8 ? s2.sessionToken.substring(0, 8) + '...' : s2.sessionToken) : null,
        player2LoginTime: s2 ? s2.createdAt : null,
        player2LastActivity: s2 ? s2.lastActivityAt : null
      });
    }

    return dtos;
  }
}

module.exports = new AdminDashboardService();
