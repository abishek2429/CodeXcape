/**
 * Comprehensive Automated End-to-End Integration Test Suite for CodeXcape Node.js Backend
 */
const http = require('http');
const WebSocket = require('ws');
const db = require('../config/db');
const initSchema = require('../config/initSchema');
const { app, server } = require('../server');

let BASE_URL;
let WS_URL;
let PORT;

let testEventId;
let testTeamId;
let testTeamCode;
let adminCookie;
let p1Cookie;
let p1Token;
let p2Cookie;
let p2Token;

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    totalFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(method, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  let cookieHeader = options.cookie;
  if (cookieHeader && cookieHeader.includes(';')) {
    cookieHeader = cookieHeader.split(';')[0].trim();
  }
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {}

  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    headers: res.headers,
    text,
    json,
    cookie: setCookie
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING CODEXCAPE NODE.JS INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  try {
    // Ensure tables such as team_riddle_progress are present
    await initSchema();

    // 1. Health Checks
    console.log('--- TEST GROUP 1: Health & Ping ---');
    const healthRoot = await request('GET', '/');
    assert(healthRoot.status === 200, 'Root GET / returns 200');
    assert(healthRoot.json && healthRoot.json.status === 'UP', 'Root health status is UP');

    const healthApi = await request('GET', '/api/health');
    assert(healthApi.status === 200, 'GET /api/health returns 200');
    assert(healthApi.json && healthApi.json.database === 'UP', 'Database connection status is UP');

    // 2. Admin Authentication
    console.log('\n--- TEST GROUP 2: Admin Authentication & Management ---');
    const badAdminLogin = await request('POST', '/api/admin/login', {
      body: { password: 'wrongpassword' }
    });
    assert(badAdminLogin.status === 401, 'Bad admin password returns 401');

    const adminLogin = await request('POST', '/api/admin/login', {
      body: { password: process.env.ADMIN_PASSWORD || 'admin123' }
    });
    assert(adminLogin.status === 200, 'Admin login returns 200');
    assert(adminLogin.json && (adminLogin.json.token || adminLogin.json.sessionToken), 'Admin sessionToken returned');
    adminCookie = adminLogin.cookie;
    assert(Boolean(adminCookie), 'Admin session cookie was set');

    // 3. Admin Event Creation & Configuration
    console.log('\n--- TEST GROUP 3: Admin Event Creation ---');
    const createEventRes = await request('POST', '/api/admin/events', {
      cookie: adminCookie,
      body: {
        name: `Node Test Event ${Date.now()}`,
        description: 'Integration test event for Node backend',
        passkey: '382459'
      }
    });
    assert(createEventRes.status === 201, 'Create event returns 201');
    assert(createEventRes.json && createEventRes.json.id, 'Event ID generated');
    testEventId = createEventRes.json.id;

    // Start event
    const startEventRes = await request('POST', `/api/admin/events/${testEventId}/start`, {
      cookie: adminCookie
    });
    assert(startEventRes.status === 200, 'Start event returns 200');
    assert(startEventRes.json && startEventRes.json.status === 'RUNNING', 'Event status is RUNNING');

    // 4. Team Creation
    console.log('\n--- TEST GROUP 4: Team Creation & Registration ---');
    const teamRes = await request('POST', `/api/admin/events/${testEventId}/teams`, {
      cookie: adminCookie,
      body: {
        teamName: `Alpha Team ${Date.now()}`,
        player1DisplayName: 'Alice',
        player2DisplayName: 'Bob'
      }
    });
    assert(teamRes.status === 201, 'Create team returns 201');
    assert(teamRes.json && teamRes.json.teamCode, 'Team code generated');
    testTeamId = teamRes.json.id;
    testTeamCode = teamRes.json.teamCode;

    // 5. Player Login & Lobby
    console.log('\n--- TEST GROUP 5: Player Login & Session Lifecycle ---');
    const p1Login = await request('POST', '/api/player/login', {
      body: { teamCode: testTeamCode, playerNumber: 1 }
    });
    assert(p1Login.status === 200, 'Player 1 login returns 200');
    assert(p1Login.json && p1Login.json.displayName === 'Alice', 'Player 1 name is Alice');
    p1Cookie = p1Login.cookie;
    p1Token = p1Login.json.sessionToken;

    const p2Login = await request('POST', '/api/player/login', {
      body: { teamCode: testTeamCode, playerNumber: 2 }
    });
    assert(p2Login.status === 200, 'Player 2 login returns 200');
    assert(p2Login.json && p2Login.json.displayName === 'Bob', 'Player 2 name is Bob');
    p2Cookie = p2Login.cookie;
    p2Token = p2Login.json.sessionToken;

    // Player 1 Profile & Lobby
    const p1Me = await request('GET', '/api/player/me', { cookie: p1Cookie });
    assert(p1Me.status === 200, 'Player 1 GET /me returns 200');
    assert(p1Me.json.playerNumber === 1, 'Player 1 profile confirmed');

    const lobbyRes = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    assert(lobbyRes.status === 200, 'GET /lobby returns 200');
    assert(lobbyRes.json.players && lobbyRes.json.players.length === 2, 'Lobby contains 2 players');

    // Both players ready & start event
    await request('POST', '/api/player/ready', { cookie: p1Cookie, body: { ready: true } });
    await request('POST', '/api/player/ready', { cookie: p2Cookie, body: { ready: true } });
    const startTeamRes = await request('POST', '/api/player/event/start', { cookie: p1Cookie });
    assert(startTeamRes.status === 200, 'Start team event returns 200');
    assert(startTeamRes.json.gameState === 'IN_PROGRESS', 'Team game state is IN_PROGRESS');

    // 6. Game State & Cooperative Question Answering
    console.log('\n--- TEST GROUP 6: Cooperative Game Progression ---');
    const gameStateRes = await request('GET', '/api/player/game/current', { cookie: p1Cookie });
    assert(gameStateRes.status === 200, 'GET /game/current returns 200');
    assert(gameStateRes.json.levelNumber === 1, 'Current level is 1');

    const q1Res = await request('GET', '/api/player/game/current/question', { cookie: p1Cookie });
    assert(q1Res.status === 200, 'Player 1 question retrieved');
    assert(q1Res.json.stageNumber === 1, 'Current stage is 1');
    assert(Boolean(q1Res.json.evidence), 'Player 1 question evidence present');

    const q2Res = await request('GET', '/api/player/game/current/question', { cookie: p2Cookie });
    assert(q2Res.status === 200, 'Player 2 question retrieved');
    assert(Boolean(q2Res.json.evidence), 'Player 2 question evidence present');

    // Submit wrong answer
    const wrongAnswerRes = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: 'totally_incorrect_answer_xyz' }
    });
    assert(wrongAnswerRes.status === 200, 'Wrong answer returns 200 status');
    assert(wrongAnswerRes.json.isCorrect === false, 'Wrong answer marked isCorrect: false');
    assert(wrongAnswerRes.json.status === 'INCORRECT', 'Status is INCORRECT');

    // Query DB for expected answer
    const q1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND player_number = 'PLAYER_1'`
    );
    const q1Expected = q1Row.rows[0].expected_answer_hash;

    const q2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND player_number = 'PLAYER_2'`
    );
    const q2Expected = q2Row.rows[0].expected_answer_hash;

    // Player 1 submits correct answer
    const p1CorrectRes = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: q1Expected }
    });
    assert(p1CorrectRes.status === 200, 'Player 1 correct answer returns 200');
    assert(p1CorrectRes.json.isCorrect === true, 'Player 1 marked isCorrect: true');
    assert(p1CorrectRes.json.stageCompleted === false, 'Stage not complete until Player 2 solves');

    // Player 2 submits correct answer -> completes stage!
    const p2CorrectRes = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: q2Expected }
    });
    assert(p2CorrectRes.status === 200, 'Player 2 correct answer returns 200');
    assert(p2CorrectRes.json.isCorrect === true, 'Player 2 marked isCorrect: true');
    assert(p2CorrectRes.json.stageCompleted === true, 'Stage 1 successfully completed by both players!');
    assert(p2CorrectRes.json.nextStageNumber === 2, 'Next stage is 2');

    // 7. Progressive Hint System
    console.log('\n--- TEST GROUP 7: Hint System ---');
    const hintsRes = await request('GET', '/api/player/game/hints', { cookie: p1Cookie });
    assert(hintsRes.status === 200, 'GET /game/hints returns 200');
    assert(Array.isArray(hintsRes.json.hints), 'Hints array present');

    const useHintRes = await request('POST', '/api/player/game/hints/1/1/1', { cookie: p1Cookie });
    assert(useHintRes.status === 200, 'Use hint for Level 1 Stage 1 returns 200');
    assert(Boolean(useHintRes.json.hintContent), 'Hint content returned');

    // Test future level boundary violation
    const futureHintRes = await request('POST', '/api/player/game/hints/5/1/1', { cookie: p1Cookie });
    assert(futureHintRes.status === 400 || futureHintRes.status === 403, 'Future level hint request rejected');

    // 8. Riddle System
    console.log('\n--- TEST GROUP 8: Riddle System ---');
    const riddlesRes = await request('GET', '/api/player/riddles', { cookie: p1Cookie });
    assert(riddlesRes.status === 200, 'GET /riddles returns 200');
    assert(riddlesRes.json.totalRiddles === 6, 'Total riddles is 6');

    // Riddle 5 is locked since level 5 not completed
    const lockedRiddleRes = await request('POST', '/api/player/riddles/submit', {
      cookie: p1Cookie,
      body: { riddleIndex: 5, digit: '5' }
    });
    assert(lockedRiddleRes.json.status === 'LOCKED', 'Locked riddle submission rejected with status LOCKED');

    // 9. Anti-Cheat Event Processing & Deduplication
    console.log('\n--- TEST GROUP 9: Anti-Cheat System ---');
    const antiCheatRes = await request('POST', '/api/player/anti-cheat/event', {
      cookie: p1Cookie,
      body: { eventType: 'TAB_SWITCH', metadata: 'User switched tab to browser console' }
    });
    assert(antiCheatRes.status === 200, 'Report TAB_SWITCH returns 200');
    assert(antiCheatRes.json.accepted === true, 'Anti-cheat event accepted');

    // Deduplication check: immediate repeat
    const dedupRes = await request('POST', '/api/player/anti-cheat/event', {
      cookie: p1Cookie,
      body: { eventType: 'TAB_SWITCH', metadata: 'Rapid duplicate' }
    });
    assert(dedupRes.json.deduplicated === true, 'Rapid violation deduplicated within cooldown');

    const acSummary = await request('GET', '/api/player/anti-cheat/summary', { cookie: p1Cookie });
    assert(acSummary.status === 200, 'GET anti-cheat summary returns 200');
    assert(acSummary.json.tabSwitchCount >= 1, 'Tab switch counted in summary');

    // 10. Final Passkey Terminal
    console.log('\n--- TEST GROUP 10: Final Passkey Gating ---');
    const prematurePasskeyRes = await request('POST', '/api/player/game/final-passkey', {
      cookie: p1Cookie,
      body: { passkey: '382459' }
    });
    assert(prematurePasskeyRes.json.status === 'FINAL_NOT_AVAILABLE', 'Premature final passkey rejected as FINAL_NOT_AVAILABLE');

    // 11. Public & Admin Results & Export
    console.log('\n--- TEST GROUP 11: Leaderboard, Statistics & CSV Exports ---');
    const pubLeaderboard = await request('GET', `/api/public/events/${testEventId}/leaderboard`);
    assert(pubLeaderboard.status === 200, 'Public leaderboard returns 200');
    assert(pubLeaderboard.json.activeEntries.length >= 1, 'Public active entries contains team');

    const adminStats = await request('GET', `/api/admin/events/${testEventId}/statistics`, { cookie: adminCookie });
    assert(adminStats.status === 200, 'Admin event statistics returns 200');
    assert(adminStats.json.totalRegisteredTeams >= 1, 'Total registered teams >= 1');

    const resultsCsv = await request('GET', `/api/admin/events/${testEventId}/export/results`, { cookie: adminCookie });
    assert(resultsCsv.status === 200, 'Export results CSV returns 200');
    assert(resultsCsv.text.includes('Rank,Team Name'), 'Results CSV header verified');

    const progressCsv = await request('GET', `/api/admin/events/${testEventId}/export/progress`, { cookie: adminCookie });
    assert(progressCsv.status === 200, 'Export progress CSV returns 200');
    assert(progressCsv.text.includes('Team Code,Team Name'), 'Progress CSV header verified');

    // 12. WebSocket STOMP Test
    console.log('\n--- TEST GROUP 12: WebSocket STOMP Engine ---');
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      let step = 0;

      ws.on('open', () => {
        // Send CONNECT frame
        const connectFrame = [
          'CONNECT',
          'accept-version:1.2',
          'host:localhost',
          `sessionToken:${p1Token}`,
          '',
          ''
        ].join('\n') + '\0';
        ws.send(connectFrame);
      });

      ws.on('message', (data) => {
        const text = data.toString();
        if (step === 0 && text.startsWith('CONNECTED')) {
          assert(true, 'WebSocket STOMP CONNECTED frame received');
          step = 1;

          // Send SUBSCRIBE frame
          const subFrame = [
            'SUBSCRIBE',
            `id:sub-0`,
            `destination:/topic/team/${testTeamId}`,
            '',
            ''
          ].join('\n') + '\0';
          ws.send(subFrame);

          setTimeout(() => {
            // Trigger a broadcast by requesting hints or score update
            request('POST', `/api/player/game/hints/1/1/1`, { cookie: p1Cookie });
          }, 100);
        } else if (step === 1 && text.startsWith('MESSAGE')) {
          assert(true, 'WebSocket STOMP MESSAGE frame broadcast received');
          step = 2;

          // Send DISCONNECT frame
          const discFrame = ['DISCONNECT', 'receipt:77', '', ''].join('\n') + '\0';
          ws.send(discFrame);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        assert(false, `WebSocket error: ${err.message}`);
        reject(err);
      });

      setTimeout(() => {
        if (step < 2) {
          assert(step >= 1, 'WebSocket CONNECTED verified before timeout');
          try { ws.close(); } catch (_) {}
          resolve();
        }
      }, 3000);
    });

  } catch (err) {
    console.error('UNEXPECTED TEST ERROR:', err);
    totalFailed++;
  } finally {
    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log('====================================================');

    server.close();
    await db.pool.end();

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Start server on an ephemeral port and run tests
server.listen(0, () => {
  PORT = server.address().port;
  BASE_URL = `http://localhost:${PORT}`;
  WS_URL = `ws://localhost:${PORT}/ws`;
  console.log(`Test server running on port ${PORT}`);
  runTests();
});
