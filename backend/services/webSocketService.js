const { WebSocketServer } = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.subscriptions = new Map(); // topic -> Set<{ ws, subId }>
    this.clientMeta = new Map();    // ws -> { teamId, isAdmin, subscriptions: Map(subId -> topic) }
    this.msgCounter = 1;
  }

  initialize(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
      if (pathname === '/ws' || pathname === '/ws/') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws) => {
      this.clientMeta.set(ws, {
        teamId: null,
        isAdmin: false,
        subscriptions: new Map()
      });

      ws.on('message', (data) => {
        this._handleStompFrame(ws, data.toString());
      });

      ws.on('close', () => {
        this._cleanupClient(ws);
      });

      ws.on('error', (err) => {
        console.warn('WebSocket error on client socket:', err.message);
        this._cleanupClient(ws);
      });
    });

    console.log('STOMP-over-WebSocket Server initialized on /ws');
  }

  getActiveConnectionCount() {
    return this.clientMeta.size;
  }

  _cleanupClient(ws) {
    const meta = this.clientMeta.get(ws);
    if (meta) {
      for (const [subId, topic] of meta.subscriptions.entries()) {
        const set = this.subscriptions.get(topic);
        if (set) {
          for (const item of set) {
            if (item.ws === ws) {
              set.delete(item);
            }
          }
          if (set.size === 0) {
            this.subscriptions.delete(topic);
          }
        }
      }
      this.clientMeta.delete(ws);
    }
  }

  _parseStompFrame(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null; // Heartbeat line

    const lines = raw.split('\n');
    const command = lines[0].trim();
    const headers = {};
    let body = '';
    let i = 1;

    while (i < lines.length && lines[i].trim() !== '') {
      const headerLine = lines[i].trim();
      const colonIdx = headerLine.indexOf(':');
      if (colonIdx > 0) {
        const key = headerLine.slice(0, colonIdx).trim();
        const val = headerLine.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
      i++;
    }

    // Skip empty line
    i++;
    if (i < lines.length) {
      body = lines.slice(i).join('\n').replace(/\0$/, '');
    }

    return { command, headers, body };
  }

  _handleStompFrame(ws, rawText) {
    // Handle heartbeats (newlines)
    if (rawText === '\n' || rawText === '\r\n') {
      ws.send('\n');
      return;
    }

    const frame = this._parseStompFrame(rawText);
    if (!frame) return;

    const { command, headers } = frame;

    if (command === 'CONNECT' || command === 'STOMP') {
      // Send CONNECTED frame
      const connectedFrame = [
        'CONNECTED',
        'version:1.2',
        'heart-beat:10000,10000',
        '',
        ''
      ].join('\n') + '\0';

      ws.send(connectedFrame);
      return;
    }

    if (command === 'SUBSCRIBE') {
      const destination = headers.destination;
      const subId = headers.id || 'sub-0';

      if (destination) {
        if (!this.subscriptions.has(destination)) {
          this.subscriptions.set(destination, new Set());
        }
        this.subscriptions.get(destination).add({ ws, subId });

        const meta = this.clientMeta.get(ws);
        if (meta) {
          meta.subscriptions.set(subId, destination);
        }
      }
      return;
    }

    if (command === 'UNSUBSCRIBE') {
      const subId = headers.id;
      const meta = this.clientMeta.get(ws);
      if (meta && subId && meta.subscriptions.has(subId)) {
        const topic = meta.subscriptions.get(subId);
        const set = this.subscriptions.get(topic);
        if (set) {
          for (const item of set) {
            if (item.ws === ws && item.subId === subId) {
              set.delete(item);
            }
          }
        }
        meta.subscriptions.delete(subId);
      }
      return;
    }

    if (command === 'DISCONNECT') {
      this._cleanupClient(ws);
      try { ws.close(); } catch (_) {}
      return;
    }

    if (command === 'SEND') {
      // Security Enforcement: Reject client-to-server STOMP SEND
      const errorFrame = [
        'ERROR',
        'message:Client-to-server messaging over STOMP is prohibited. All game state actions must use authoritative REST APIs.',
        '',
        ''
      ].join('\n') + '\0';
      try { ws.send(errorFrame); } catch (_) {}
      return;
    }
  }

  broadcast(topic, payload) {
    const clients = this.subscriptions.get(topic);
    if (!clients || clients.size === 0) return;

    const payloadJson = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const msgId = 'msg-' + (this.msgCounter++);

    for (const { ws, subId } of clients) {
      if (ws.readyState === 1 /* OPEN */) {
        const messageFrame = [
          'MESSAGE',
          `destination:${topic}`,
          'content-type:application/json',
          `subscription:${subId}`,
          `message-id:${msgId}`,
          '',
          payloadJson
        ].join('\n') + '\0';

        try {
          ws.send(messageFrame);
        } catch (e) {
          console.warn('Failed to send STOMP frame to client', e.message);
        }
      }
    }
  }

  broadcastToTeam(teamId, eventPayload) {
    if (!teamId) return;
    this.broadcast(`/topic/team/${teamId}`, eventPayload);
  }

  broadcastToAdmin(eventPayload) {
    this.broadcast('/topic/admin', eventPayload);
  }

  notifyPlayerConnection(teamId, playerId, playerNumber, displayName, isConnected) {
    const payload = {
      type: isConnected ? 'PLAYER_CONNECTED' : 'PLAYER_DISCONNECTED',
      teamId,
      playerId,
      playerNumber,
      message: `${displayName || 'Operator ' + playerNumber} ${isConnected ? 'connected' : 'disconnected'}`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }

  notifyPartnerChallengeCompleted(teamId, levelNumber, stageNumber, completedPlayerNumber) {
    const payload = {
      type: 'PARTNER_CHALLENGE_COMPLETED',
      teamId,
      levelNumber,
      stageNumber,
      playerNumber: completedPlayerNumber,
      message: `Your teammate (Player ${completedPlayerNumber}) completed their challenge ✓`,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyStageCompleted(teamId, levelNumber, stageNumber, nextStageNumber) {
    const payload = {
      type: 'STAGE_COMPLETED',
      teamId,
      levelNumber,
      stageNumber,
      nextStageNumber,
      message: `Stage ${stageNumber} completed by both players ✓`,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyLevelCompleted(teamId, levelNumber) {
    const payload = {
      type: 'LEVEL_COMPLETED',
      teamId,
      levelNumber,
      message: `Level ${levelNumber} completed by both players ✓`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyNextLevelUnlocked(teamId, nextLevelNumber) {
    const payload = {
      type: 'NEXT_LEVEL_UNLOCKED',
      teamId,
      nextLevelNumber,
      message: `Level ${nextLevelNumber} is now unlocked!`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyEventStarted(teamId) {
    const payload = {
      type: 'EVENT_STARTED',
      teamId,
      message: 'Event is now active. Escape room started!',
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }

  notifyStoryStarted(teamId, storyKey, activeStoryState) {
    const payload = {
      type: 'STORY_STARTED',
      teamId,
      message: `Cinematic story sequence triggered [${storyKey}]`,
      activeStoryState,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }

  notifyStoryCompleted(teamId, storyKey) {
    const payload = {
      type: 'STORY_COMPLETED',
      teamId,
      message: `Cinematic story sequence completed [${storyKey}]`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }

  notifyHintUnlocked(teamId, levelNumber, hintNumber) {
    const payload = {
      type: 'HINT_UNLOCKED',
      teamId,
      levelNumber,
      message: `Level ${levelNumber} Hint ${hintNumber} revealed`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }

  notifyGameCompleted(teamId) {
    const payload = {
      type: 'GAME_COMPLETED',
      teamId,
      message: 'CODEXCAPE COMPLETED! Your team successfully escaped!',
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyEventStatusChange(teamId, message) {
    const payload = {
      type: 'GAME_STATE_UPDATED',
      teamId,
      message,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyRankChanged(teamId, newRank) {
    const payload = {
      type: 'RANK_CHANGED',
      teamId,
      newRank,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyTeamAntiCheatAlert(teamId, teamCode, playerNumber, violationType, penaltyPoints, teamTotalPenalties, message) {
    const payload = {
      type: 'ANTI_CHEAT_ALERT',
      teamId,
      teamCode,
      playerNumber,
      violationType,
      penaltyPoints,
      teamTotalPenalties,
      message,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyAdminAntiCheatEvent(teamId, teamCode, playerId, playerNumber, displayName, violationType, penaltyPoints, teamTotalPenalties, totalViolations, message) {
    const payload = {
      type: 'ANTI_CHEAT_EVENT',
      teamId,
      teamCode,
      playerId,
      playerNumber,
      displayName,
      violationType,
      penaltyPoints,
      teamTotalPenalties,
      totalViolations,
      message,
      timestamp: new Date().toISOString()
    };
    this.broadcastToAdmin(payload);
  }

  notifyTeamScoreChanged(teamId, scoreSummary) {
    if (!teamId || !scoreSummary) return;
    const payload = {
      type: 'SCORE_UPDATED',
      teamId,
      teamCode: scoreSummary.teamCode,
      newRank: scoreSummary.currentRank,
      scoreSummary,
      message: `Team score updated: ${scoreSummary.finalScore} pts (Rank #${scoreSummary.currentRank})`,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
  }

  notifyGameStateUpdated(teamId, message = 'Game state updated') {
    const payload = {
      type: 'GAME_STATE_UPDATED',
      teamId,
      message,
      timestamp: new Date().toISOString()
    };
    this.broadcastToTeam(teamId, payload);
    this.broadcastToAdmin(payload);
  }
}

module.exports = new WebSocketService();
