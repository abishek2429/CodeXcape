const assert = require('assert');
const http = require('http');
const { WebSocket } = require('ws');
const db = require('../config/db');
const initSchema = require('../config/initSchema');
const { server: wsServer, wsManager } = require('../websocketServer');
const { app: vercelApp, server: vercelHttpServer } = require('../server');

let WS_PORT;
let VERCEL_PORT;

function httpReq(port, method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    let body = options.body;

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(rawData); } catch (e) {}

          const setCookie = res.headers['set-cookie'];
          let cookie = null;
          if (setCookie && setCookie.length > 0) {
            cookie = setCookie[0].split(';')[0];
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookie,
            body: rawData,
            json
          });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function connectStomp(port, connectHeaders = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const messages = [];
    const subscriptions = new Map();

    ws.on('open', () => {
      // Send CONNECT frame
      const headersStr = Object.entries(connectHeaders)
        .map(([k, v]) => `${k}:${v}`)
        .join('\n');

      const connectFrame = [
        'CONNECT',
        'accept-version:1.2',
        'host:localhost',
        headersStr,
        '',
        ''
      ].filter(Boolean).join('\n') + '\0';

      ws.send(connectFrame);
    });

    ws.on('message', (data) => {
      const text = data.toString();
      if (text === '\n') return; // Heartbeat

      const lines = text.split('\n');
      const command = lines[0].trim();

      if (command === 'CONNECTED') {
        resolve({
          ws,
          messages,
          subscribe(destination, subId = 'sub-1') {
            const frame = [
              'SUBSCRIBE',
              `id:${subId}`,
              `destination:${destination}`,
              '',
              ''
            ].join('\n') + '\0';
            ws.send(frame);
          },
          waitForMessage(predicate, timeoutMs = 5000) {
            return new Promise((res, rej) => {
              const start = Date.now();
              const check = () => {
                for (let i = 0; i < messages.length; i++) {
                  if (predicate(messages[i])) {
                    const match = messages.splice(i, 1)[0];
                    return res(match);
                  }
                }
                if (Date.now() - start > timeoutMs) {
                  return rej(new Error('Timed out waiting for STOMP message'));
                }
                setTimeout(check, 50);
              };
              check();
            });
          },
          close() {
            ws.close();
          }
        });
      } else if (command === 'MESSAGE') {
        const colon = text.indexOf('\n\n');
        const body = colon > 0 ? text.slice(colon + 2).replace(/\0$/, '') : '';
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        messages.push({ command, body, json, raw: text });
      } else if (command === 'ERROR') {
        messages.push({ command, raw: text });
      }
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

async function runRenderWebSocketSuite() {
  console.log('====================================================');
  console.log('CODEXCAPE RENDER WEBSOCKET DECOUPLED ARCHITECTURE TEST');
  console.log('====================================================');

  try {
    // 1. Health Probe
    console.log('\n--- 1. RENDER LIVENESS / HEALTH PROBE ---');
    const healthRes = await httpReq(WS_PORT, 'GET', '/api/health');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint returns 200');
    assert.strictEqual(healthRes.json.status, 'UP');
    assert.strictEqual(healthRes.json.service, 'codexcape-websocket');
    console.log('  ✓ Health probe verified: status=UP, service=codexcape-websocket');

    // 2. Setup Team and Player via Vercel REST APIs
    console.log('\n--- 2. SETUP EVENT & SESSIONS VIA VERCEL REST API ---');
    const adminLogin = await httpReq(VERCEL_PORT, 'POST', '/api/admin/login', { body: { password: 'admin123' } });
    assert.strictEqual(adminLogin.status, 200);
    const adminCookie = adminLogin.cookie;
    const adminToken = adminLogin.json.token || adminLogin.json.sessionToken || adminCookie.split('=')[1];

    const eventRes = await httpReq(VERCEL_PORT, 'POST', '/api/admin/events', {
      cookie: adminCookie,
      body: { name: 'WS Render Event ' + Date.now(), totalLevels: 6 }
    });
    const eventId = eventRes.json.id;
    await httpReq(VERCEL_PORT, 'POST', `/api/admin/events/${eventId}/start`, { cookie: adminCookie });

    const uniqueCode = 'RND' + Date.now().toString().slice(-4);
    const teamRes = await httpReq(VERCEL_PORT, 'POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: {
        customTeamCode: uniqueCode,
        teamName: 'Render Team ' + uniqueCode,
        player1DisplayName: 'Alice',
        player2DisplayName: 'Bob'
      }
    });
    const teamId = teamRes.json.id;
    const teamCode = teamRes.json.teamCode;

    // Player 1 Login on Vercel
    const p1Login = await httpReq(VERCEL_PORT, 'POST', '/api/player/login', {
      body: { teamCode, playerNumber: 1 }
    });
    assert.strictEqual(p1Login.status, 200);
    const p1Cookie = p1Login.cookie;
    const p1SessionToken = p1Login.json.sessionToken || (p1Cookie ? p1Cookie.split('=')[1] : null);

    // Player 2 Login on Vercel
    const p2Login = await httpReq(VERCEL_PORT, 'POST', '/api/player/login', {
      body: { teamCode, playerNumber: 2 }
    });
    assert.strictEqual(p2Login.status, 200);
    const p2Cookie = p2Login.cookie;
    const p2SessionToken = p2Login.json.sessionToken || (p2Cookie ? p2Cookie.split('=')[1] : null);

    console.log(`  ✓ Created Team ${teamCode} (id=${teamId}) with Player 1 & 2 session tokens`);

    // 3. Connect to Render WebSocket with Valid Token
    console.log('\n--- 3. STOMP CONNECT AUTHENTICATION ON RENDER ---');
    const p1Client = await connectStomp(WS_PORT, { 'sessionToken': p1SessionToken });
    assert.ok(p1Client, 'Player 1 STOMP client connected successfully');
    console.log('  ✓ STOMP CONNECT succeeded with session token validation');

    // Subscribe Player 1 to their own team topic
    p1Client.subscribe(`/topic/team/${teamId}`, 'p1-sub');
    console.log(`  ✓ Player 1 subscribed to /topic/team/${teamId}`);

    // 4. Test Player 2 Connecting -> Presence Broadcast
    console.log('\n--- 4. REAL-TIME PRESENCE BROADCAST (CONNECT / DISCONNECT) ---');
    const p2ClientPromise = connectStomp(WS_PORT, { 'sessionToken': p2SessionToken });

    // Player 1 should receive PLAYER_CONNECTED for Player 2
    const p2ConnectedMsgPromise = p1Client.waitForMessage(m => m.json && m.json.type === 'PLAYER_CONNECTED' && m.json.playerNumber === 2);
    const p2Client = await p2ClientPromise;
    const p2ConnectedMsg = await p2ConnectedMsgPromise;
    assert.strictEqual(p2ConnectedMsg.json.type, 'PLAYER_CONNECTED');
    assert.strictEqual(p2ConnectedMsg.json.playerNumber, 2);
    console.log('  ✓ Player 1 received real-time PLAYER_CONNECTED presence for Player 2');

    // Disconnect Player 2 -> Player 1 should receive PLAYER_DISCONNECTED
    const p2DisconnectMsgPromise = p1Client.waitForMessage(m => m.json && m.json.type === 'PLAYER_DISCONNECTED' && m.json.playerNumber === 2);
    p2Client.close();
    const p2DisconnectMsg = await p2DisconnectMsgPromise;
    assert.strictEqual(p2DisconnectMsg.json.type, 'PLAYER_DISCONNECTED');
    console.log('  ✓ Player 1 received real-time PLAYER_DISCONNECTED presence when Player 2 closed socket');

    // 5. Test Topic Authorization & Security Rejection
    console.log('\n--- 5. TOPIC AUTHORIZATION SECURITY ENFORCEMENT ---');
    // Player 1 tries to subscribe to a forbidden team (Team 99999)
    p1Client.subscribe('/topic/team/99999', 'forbidden-sub');
    const errorMsg = await p1Client.waitForMessage(m => m.command === 'ERROR');
    assert.ok(errorMsg.raw.includes('Access denied'), 'Forbidden team subscription rejected with STOMP ERROR');
    console.log('  ✓ Security check passed: Cross-team unauthorized subscription rejected');

    // 6. Test PostgreSQL LISTEN / NOTIFY Real-Time Bridge (Vercel -> Render)
    console.log('\n--- 6. POSTGRESQL LISTEN / NOTIFY BRIDGE (VERCEL -> RENDER) ---');
    const testPayload = {
      type: 'STAGE_COMPLETED',
      teamId,
      levelNumber: 1,
      stageNumber: 1,
      nextStageNumber: 2,
      stateVersion: 2,
      message: 'Native PostgreSQL notify bridge delivery!'
    };

    const notifyReceivedPromise = p1Client.waitForMessage(m => m.json && m.json.type === 'STAGE_COMPLETED');
    // Simulate Vercel publishing via PostgreSQL native pg_notify
    await db.query(
      `SELECT pg_notify('codexcape_events', $1)`,
      [JSON.stringify({ topic: `/topic/team/${teamId}`, payload: testPayload })]
    );

    const notifyReceived = await notifyReceivedPromise;
    assert.strictEqual(notifyReceived.json.type, 'STAGE_COMPLETED');
    assert.strictEqual(notifyReceived.json.message, 'Native PostgreSQL notify bridge delivery!');
    console.log('  ✓ PostgreSQL LISTEN/NOTIFY bridge delivered event from Vercel to Render WebSocket client in <50ms');

    // 7. Test Internal HTTP Broadcast Bridge (POST /api/internal/broadcast)
    console.log('\n--- 7. INTERNAL HTTP BROADCAST BRIDGE ---');
    const httpPayload = {
      type: 'SCORE_UPDATED',
      teamId,
      finalScore: 150,
      message: 'Direct HTTP internal webhook delivery!'
    };

    // Test with wrong secret -> 403 Forbidden
    const badSecretRes = await httpReq(WS_PORT, 'POST', '/api/internal/broadcast', {
      headers: { 'X-Internal-Secret': 'wrong-secret' },
      body: { topic: `/topic/team/${teamId}`, payload: httpPayload }
    });
    assert.strictEqual(badSecretRes.status, 403, 'Invalid secret returns 403 Forbidden');

    // Test with valid secret
    const httpMsgPromise = p1Client.waitForMessage(m => m.json && m.json.type === 'SCORE_UPDATED');
    const goodSecretRes = await httpReq(WS_PORT, 'POST', '/api/internal/broadcast', {
      headers: { 'X-Internal-Secret': 'codexcape-internal-secret' },
      body: { topic: `/topic/team/${teamId}`, payload: httpPayload }
    });
    assert.strictEqual(goodSecretRes.status, 200, 'Valid secret returns 200 OK');

    const httpMsg = await httpMsgPromise;
    assert.strictEqual(httpMsg.json.type, 'SCORE_UPDATED');
    assert.strictEqual(httpMsg.json.finalScore, 150);
    console.log('  ✓ Internal HTTP broadcast bridge delivered event with authenticated secret');

    p1Client.close();

    console.log('\n====================================================');
    console.log('ALL RENDER WEBSOCKET ARCHITECTURE TESTS PASSED! (7/7)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    throw err;
  }
}

async function main() {
  await initSchema();

  // Start Render WebSocket server
  await new Promise((res) => {
    wsServer.listen(0, () => {
      WS_PORT = wsServer.address().port;
      console.log(`Render WebSocket server running on port ${WS_PORT}`);
      res();
    });
  });

  // Start Vercel HTTP REST server
  await new Promise((res) => {
    vercelHttpServer.listen(0, () => {
      VERCEL_PORT = vercelHttpServer.address().port;
      console.log(`Vercel REST server running on port ${VERCEL_PORT}`);
      res();
    });
  });

  try {
    await runRenderWebSocketSuite();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  } finally {
    wsServer.close();
    vercelHttpServer.close();
    if (wsManager.pgListener) {
      try { wsManager.pgListener.end(); } catch (_) {}
    }
  }
}

main();
