/**
 * Dedicated Render WebSocket Service for CodeXcape
 *
 * Provides:
 * - Persistent STOMP 1.2 over WebSocket (/ws)
 * - Session token validation against PostgreSQL
 * - Topic authorization (/topic/team/:teamId, /topic/admin)
 * - Real-time presence tracking (connect / disconnect)
 * - PostgreSQL native LISTEN / NOTIFY bridge ('codexcape_events')
 * - Internal HTTP broadcast bridge (POST /api/internal/broadcast)
 * - Render liveness/health probe (GET /api/health)
 */

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const http = require('http');
const { WebSocketServer } = require('ws');
const { Client } = require('pg');
const db = require('./config/db');
const env = require('./config/env');

const PORT = process.env.PORT || 10000;
const INTERNAL_SECRET = process.env.INTERNAL_WS_SECRET || 'codexcape-internal-secret';

// CORS Configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'https://code-xcape.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    const isAllowed = allowedOrigins.some(ao => {
      if (ao === origin) return true;
      if (ao.includes('*') && origin.endsWith(ao.replace('https://*.', '.'))) return true;
      return false;
    }) || origin.includes('localhost') || origin.includes('127.0.0.1');

    res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Secret, sessionToken, X-Player-Session, X-Admin-Session');
}

class RenderWebSocketManager {
  constructor() {
    this.wss = null;
    this.subscriptions = new Map(); // destination -> Set<{ ws, subId }>
    this.clientMeta = new Map();    // ws -> { teamId, playerId, playerNumber, displayName, isAdmin, subscriptions: Map(subId -> topic) }
    this.msgCounter = 1;
    this.pgListener = null;
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
        playerId: null,
        playerNumber: null,
        displayName: null,
        isAdmin: false,
        isAuthenticated: false,
        subscriptions: new Map()
      });

      ws.on('message', async (data) => {
        try {
          await this._handleStompFrame(ws, data.toString());
        } catch (err) {
          console.warn('[WS] Error processing frame:', err.message);
        }
      });

      ws.on('close', () => {
        this._cleanupClient(ws);
      });

      ws.on('error', (err) => {
        console.warn('[WS] Socket error:', err.message);
        this._cleanupClient(ws);
      });
    });

    this._startPostgresListener();
    console.log('[WS] Render WebSocket Server initialized on path /ws');
  }

  getActiveConnectionCount() {
    return this.clientMeta.size;
  }

  _cleanupClient(ws) {
    const meta = this.clientMeta.get(ws);
    if (!meta) return;

    // Unsubscribe from all topics
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

    // Broadcast disconnection if player was authenticated
    if (meta.teamId && meta.playerNumber) {
      this.broadcastToTeam(meta.teamId, {
        type: 'PLAYER_DISCONNECTED',
        teamId: meta.teamId,
        playerId: meta.playerId,
        playerNumber: meta.playerNumber,
        displayName: meta.displayName,
        message: `${meta.displayName || 'Operator ' + meta.playerNumber} disconnected`,
        timestamp: new Date().toISOString()
      });

      this.broadcastToAdmin({
        type: 'PLAYER_DISCONNECTED',
        teamId: meta.teamId,
        playerId: meta.playerId,
        playerNumber: meta.playerNumber,
        displayName: meta.displayName,
        timestamp: new Date().toISOString()
      });
    }

    this.clientMeta.delete(ws);
  }

  _parseStompFrame(raw) {
    const cleanRaw = raw.replace(/\0/g, '');
    const trimmed = cleanRaw.trim();
    if (!trimmed) return null; // Heartbeat line

    const lines = cleanRaw.split('\n');
    const command = lines[0].trim();
    const headers = {};
    let body = '';
    let i = 1;

    while (i < lines.length && lines[i].trim() !== '') {
      const headerLine = lines[i].trim();
      const colonIdx = headerLine.indexOf(':');
      if (colonIdx > 0) {
        const key = headerLine.slice(0, colonIdx).trim().toLowerCase();
        const val = headerLine.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
      i++;
    }

    // Skip empty line
    i++;
    if (i < lines.length) {
      body = lines.slice(i).join('\n');
    }

    return { command, headers, body };
  }

  async _handleStompFrame(ws, rawText) {
    // Handle heartbeats (newlines)
    if (rawText === '\n' || rawText === '\r\n') {
      if (ws.readyState === 1) ws.send('\n');
      return;
    }

    const frame = this._parseStompFrame(rawText);
    if (!frame) return;

    const { command, headers } = frame;

    if (command === 'CONNECT' || command === 'STOMP') {
      const token = headers['sessiontoken'] || headers['x-player-session'] || headers['x-session-token'] || headers['authorization'];
      const meta = this.clientMeta.get(ws);

      if (token && meta) {
        await this._authenticateSocket(meta, token);
      }

      // Send CONNECTED frame
      const connectedFrame = [
        'CONNECTED',
        'version:1.2',
        'heart-beat:10000,10000',
        '',
        ''
      ].join('\n') + '\0';

      if (ws.readyState === 1) {
        ws.send(connectedFrame);
      }

      // If player authenticated, broadcast PLAYER_CONNECTED
      if (meta && meta.teamId && meta.playerNumber) {
        this.broadcastToTeam(meta.teamId, {
          type: 'PLAYER_CONNECTED',
          teamId: meta.teamId,
          playerId: meta.playerId,
          playerNumber: meta.playerNumber,
          displayName: meta.displayName,
          message: `${meta.displayName || 'Operator ' + meta.playerNumber} connected`,
          timestamp: new Date().toISOString()
        });

        this.broadcastToAdmin({
          type: 'PLAYER_CONNECTED',
          teamId: meta.teamId,
          playerId: meta.playerId,
          playerNumber: meta.playerNumber,
          displayName: meta.displayName,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    if (command === 'SUBSCRIBE') {
      const destination = headers['destination'];
      const subId = headers['id'] || 'sub-0';
      const meta = this.clientMeta.get(ws);

      if (destination && meta) {
        // Enforce Topic Authorization
        if (destination.startsWith('/topic/team/')) {
          const teamIdStr = destination.replace('/topic/team/', '');
          const reqTeamId = parseInt(teamIdStr, 10);
          if (meta.isAuthenticated && !meta.isAdmin && meta.teamId !== reqTeamId) {
            console.warn(`[WS Auth] Forbidden team subscription attempt. Socket teamId=${meta.teamId}, requested=${reqTeamId}`);
            this._sendError(ws, 'Access denied: You cannot subscribe to telemetry for another team.');
            return;
          }
        } else if (destination === '/topic/admin') {
          if (meta.isAuthenticated && !meta.isAdmin) {
            console.warn('[WS Auth] Forbidden admin subscription attempt by non-admin socket');
            this._sendError(ws, 'Access denied: Admin monitoring requires elevated security clearance.');
            return;
          }
        }

        if (!this.subscriptions.has(destination)) {
          this.subscriptions.set(destination, new Set());
        }
        this.subscriptions.get(destination).add({ ws, subId });
        meta.subscriptions.set(subId, destination);
      }
      return;
    }

    if (command === 'UNSUBSCRIBE') {
      const subId = headers['id'];
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
      this._sendError(ws, 'Client-to-server messaging over STOMP is prohibited. All game state actions must use authoritative REST APIs.');
      return;
    }
  }

  _sendError(ws, message) {
    if (ws.readyState === 1) {
      const errorFrame = [
        'ERROR',
        `message:${message}`,
        '',
        ''
      ].join('\n') + '\0';
      try { ws.send(errorFrame); } catch (_) {}
    }
  }

  async _authenticateSocket(meta, token) {
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();

      // Check player game session
      const playerSessionRes = await db.query(
        `SELECT gs.id, gs.team_id, gs.player_id, gs.status, p.player_number, p.display_name, p.is_active
         FROM game_sessions gs
         JOIN players p ON gs.player_id = p.id
         WHERE gs.session_token = $1 AND gs.status = 'ACTIVE'`,
        [cleanToken]
      );

      if (playerSessionRes.rows.length > 0) {
        const row = playerSessionRes.rows[0];
        meta.isAuthenticated = true;
        meta.teamId = parseInt(row.team_id, 10);
        meta.playerId = parseInt(row.player_id, 10);
        meta.playerNumber = parseInt(row.player_number, 10);
        meta.displayName = row.display_name;
        meta.isAdmin = false;
        return;
      }

      // Check admin session
      const adminSessionRes = await db.query(
        `SELECT id, status FROM admin_sessions WHERE session_token = $1 AND status = 'ACTIVE'`,
        [cleanToken]
      );

      if (adminSessionRes.rows.length > 0) {
        meta.isAuthenticated = true;
        meta.isAdmin = true;
        meta.displayName = 'Administrator';
        return;
      }
    } catch (err) {
      console.warn('[WS Auth] Session lookup error:', err.message);
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
          console.warn('[WS] Failed to send STOMP frame:', e.message);
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

  _startPostgresListener() {
    const connStr = env.DATABASE_URL;
    if (!connStr) {
      console.warn('[WS PG] DATABASE_URL not set, native LISTEN/NOTIFY disabled.');
      return;
    }

    const isRemote = connStr.includes('aws') || connStr.includes('supabase') || connStr.includes('render');
    this.pgListener = new Client({
      connectionString: connStr,
      ssl: isRemote ? { rejectUnauthorized: false } : false
    });

    this.pgListener.connect()
      .then(async () => {
        console.log('[WS PG] Connected to PostgreSQL for real-time notification bridge.');
        await this.pgListener.query('LISTEN codexcape_events');
        console.log('[WS PG] Listening on channel: codexcape_events');

        this.pgListener.on('notification', (msg) => {
          if (msg.channel === 'codexcape_events' && msg.payload) {
            try {
              const data = JSON.parse(msg.payload);
              if (data.topic && data.payload) {
                this.broadcast(data.topic, data.payload);
              }
            } catch (e) {
              console.warn('[WS PG] Failed to parse notification payload:', e.message);
            }
          }
        });

        this.pgListener.on('error', (err) => {
          console.error('[WS PG] Listener error:', err.message);
          this._reconnectPostgresListener();
        });
      })
      .catch((err) => {
        console.error('[WS PG] Connection error:', err.message);
        this._reconnectPostgresListener();
      });
  }

  _reconnectPostgresListener() {
    if (this.pgListener) {
      try { this.pgListener.end(); } catch (_) {}
      this.pgListener = null;
    }
    setTimeout(() => {
      console.log('[WS PG] Reconnecting PostgreSQL listener...');
      this._startPostgresListener();
    }, 5000);
  }
}

const wsManager = new RenderWebSocketManager();

// Create HTTP Server
const server = http.createServer((req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Liveness / Health Probe for Render
  if ((pathname === '/' || pathname === '/api/health') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: 'codexcape-websocket',
      timestamp: new Date().toISOString(),
      activeConnections: wsManager.getActiveConnectionCount(),
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  // Internal HTTP Broadcast Webhook (From Vercel)
  if (pathname === '/api/internal/broadcast' && req.method === 'POST') {
    const secret = req.headers['x-internal-secret'];
    if (secret !== INTERNAL_SECRET) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden: Invalid internal secret' }));
      return;
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(rawBody);
        if (body.topic && body.payload) {
          wsManager.broadcast(body.topic, body.payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing topic or payload in body' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Attach WebSocket Server
wsManager.initialize(server);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[RENDER-WS] CodeXcape Dedicated WebSocket Service running on port ${PORT}`);
  });

  const shutdown = () => {
    console.log('[RENDER-WS] Shutting down gracefully...');
    server.close(() => {
      if (wsManager.pgListener) {
        try { wsManager.pgListener.end(); } catch (_) {}
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { server, wsManager };
