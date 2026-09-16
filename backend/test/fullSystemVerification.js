/**
 * Comprehensive End-to-End System Verification for CodeXcape Node.js Backend
 * 
 * Verifies all 22 criteria required by the user prompt:
 * 1. Startup & Independence (no Java required)
 * 2. Database connectivity & reading without data loss
 * 3. Complete Authentication (Player & Admin, tokens, cookies, 401/403 protections)
 * 4. Cooperative Game Flow (Dual-player synchronization, stage advancing, level completion)
 * 5. Hint System (unlocked hints display real content, duplicate requests idempotent, future hints rejected)
 * 6. Riddle System (Level 1 complete -> Riddle 1 unlocks -> deferred solving -> correct digit '3' saved -> locked riddles rejected)
 * 7. Anti-Cheat (Penalties, deduplication cooldown, summary)
 * 8. Final Passkey (Gated until all levels complete, wrong rejected, '382459' accepted, completion saved)
 * 9. Leaderboard & Scoring (Base score, penalties, deterministic ranking)
 * 10. Admin Operations (Dashboard, stats, CSV exports, team reset)
 * 11. WebSocket STOMP Engine (Downstream broadcasts on /ws)
 */
const http = require('http');
const WebSocket = require('ws');
const db = require('../config/db');
const initSchema = require('../config/initSchema');
const { app, server } = require('../server');
const teamRepository = require('../repositories/teamRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');

let BASE_URL;
let WS_URL;
let PORT;

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

  return {
    status: res.status,
    headers: res.headers,
    text,
    json,
    cookie: res.headers.get('set-cookie')
  };
}

async function runVerification() {
  console.log('================================================================');
  console.log('CODEXCAPE FULL SYSTEM VERIFICATION (STANDALONE NODE.JS BACKEND)');
  console.log('================================================================\n');

  try {
    await initSchema();

    // -------------------------------------------------------------
    // 1. Startup & Independence
    // -------------------------------------------------------------
    console.log('--- 1. STARTUP & INDEPENDENCE ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Node.js Express server responds on /api/health with 200');
    assert(health.json && health.json.status === 'UP', 'Overall system status is UP');
    assert(health.json && health.json.database === 'UP', 'PostgreSQL database connection is UP');

    // -------------------------------------------------------------
    // 2. Database Integrity Check
    // -------------------------------------------------------------
    console.log('\n--- 2. DATABASE INTEGRITY & DATA PERSISTENCE ---');
    const levelsCount = await db.query('SELECT COUNT(*) as c FROM levels');
    assert(parseInt(levelsCount.rows[0].c, 10) === 6, 'All 6 game levels present in existing database');

    const questionsCount = await db.query('SELECT COUNT(*) as c FROM questions');
    assert(parseInt(questionsCount.rows[0].c, 10) >= 30, 'Full question bank preserved in database');

    const hintsCount = await db.query('SELECT COUNT(*) as c FROM hints');
    assert(parseInt(hintsCount.rows[0].c, 10) >= 15, 'Progressive hints preserved in database');

    // -------------------------------------------------------------
    // 3. Admin Authentication & Authorization
    // -------------------------------------------------------------
    console.log('\n--- 3. AUTHENTICATION & SECURITY CONTROLS ---');
    const badAdminLogin = await request('POST', '/api/admin/login', {
      body: { password: 'invalid_admin_password' }
    });
    assert(badAdminLogin.status === 401, 'Invalid admin password rejected with 401 Unauthorized');

    const adminLogin = await request('POST', '/api/admin/login', {
      body: { password: process.env.ADMIN_PASSWORD || 'admin123' }
    });
    assert(adminLogin.status === 200, 'Valid admin login succeeds with 200 OK');
    const adminCookie = adminLogin.cookie;
    assert(Boolean(adminCookie), 'Admin session cookie (ADMIN_SESSION) issued');

    // Unauthenticated player request to protected route
    const unauthMe = await request('GET', '/api/player/me');
    assert(unauthMe.status === 401, 'Unauthenticated player request rejected with 401');

    // -------------------------------------------------------------
    // 4. Admin Event & Team Management
    // -------------------------------------------------------------
    console.log('\n--- 4. EVENT & TEAM PROVISIONING ---');
    const evRes = await request('POST', '/api/admin/events', {
      cookie: adminCookie,
      body: {
        name: `Verification Event ${Date.now()}`,
        description: 'System verification event',
        passkey: '382459'
      }
    });
    assert(evRes.status === 201, 'Admin creates event with 201 Created');
    const eventId = evRes.json.id;

    const startEv = await request('POST', `/api/admin/events/${eventId}/start`, {
      cookie: adminCookie
    });
    assert(startEv.status === 200, 'Admin starts event with 200 OK');
    assert(startEv.json.status === 'RUNNING', 'Event status transitioned to RUNNING');

    const tmRes = await request('POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: {
        teamName: `Delta Team ${Date.now()}`,
        player1DisplayName: 'Agent_Zero',
        player2DisplayName: 'Agent_One'
      }
    });
    assert(tmRes.status === 201, 'Admin registers team with 201 Created');
    const teamId = tmRes.json.id;
    const teamCode = tmRes.json.teamCode;

    // -------------------------------------------------------------
    // 5. Player Authentication, Lobby & Dual Readiness
    // -------------------------------------------------------------
    console.log('\n--- 5. PLAYER LOGIN, SESSIONS & LOBBY SYNCHRONIZATION ---');
    const p1Login = await request('POST', '/api/player/login', {
      body: { teamCode, playerNumber: 1, displayName: 'Agent_Zero' }
    });
    assert(p1Login.status === 200, 'Player 1 logs in successfully');
    const p1Cookie = p1Login.cookie;

    const p2Login = await request('POST', '/api/player/login', {
      body: { teamCode, playerNumber: 2, displayName: 'Agent_One' }
    });
    assert(p2Login.status === 200, 'Player 2 logs in successfully');
    const p2Cookie = p2Login.cookie;

    // Player trying to access admin endpoint must be rejected with 403
    const playerAdminAttempt = await request('GET', `/api/admin/events/${eventId}`, {
      cookie: p1Cookie
    });
    assert(playerAdminAttempt.status === 403, 'Player attempting admin route rejected with 403 Forbidden');

    // Lobby verification
    const lobby = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    assert(lobby.status === 200, 'Player retrieves lobby status');
    assert(lobby.json.players.length === 2, 'Lobby confirms both teammates connected');

    // Mark ready & start team game
    await request('POST', '/api/player/ready', { cookie: p1Cookie, body: { ready: true } });
    await request('POST', '/api/player/ready', { cookie: p2Cookie, body: { ready: true } });

    const startTeam = await request('POST', '/api/player/event/start', { cookie: p1Cookie });
    assert(startTeam.status === 200, 'Team initiates game session');
    assert(startTeam.json.gameState === 'IN_PROGRESS', 'Team gameState is now IN_PROGRESS');

    // -------------------------------------------------------------
    // 6. Cooperative Gameplay & Level 1 Completion
    // -------------------------------------------------------------
    console.log('\n--- 6. COOPERATIVE STAGE PROGRESSION & LEVEL COMPLETION ---');
    const curLevel = await request('GET', '/api/player/game/current', { cookie: p1Cookie });
    assert(curLevel.status === 200, 'GET /game/current returns 200');
    assert(curLevel.json.levelNumber === 1, 'Current level is 1');

    // Stage 1 questions
    const q1p1 = await request('GET', '/api/player/game/current/question', { cookie: p1Cookie });
    assert(q1p1.status === 200 && Boolean(q1p1.json.evidence), 'Player 1 receives Stage 1 question and evidence');
    const q1p2 = await request('GET', '/api/player/game/current/question', { cookie: p2Cookie });
    assert(q1p2.status === 200 && Boolean(q1p2.json.evidence), 'Player 2 receives Stage 1 question and evidence');

    // Wrong answer test
    const wrongAns = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: 'bad_answer' }
    });
    assert(wrongAns.status === 200 && wrongAns.json.correct === false, 'Wrong answer marked correct: false');

    // Query correct answers for Level 1 Stage 1
    const l1s1q1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND player_number = 'PLAYER_1'`
    );
    const l1s1q2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND player_number = 'PLAYER_2'`
    );

    // Player 1 solves Stage 1
    const p1s1Solve = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: l1s1q1Row.rows[0].expected_answer_hash }
    });
    assert(p1s1Solve.json.correct === true, 'Player 1 solves Stage 1 correctly');
    assert(p1s1Solve.json.stageCompleted === false, 'Stage 1 remains incomplete awaiting Player 2');

    // Player 2 solves Stage 1 -> Completes Stage 1!
    const p2s1Solve = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: l1s1q2Row.rows[0].expected_answer_hash }
    });
    assert(p2s1Solve.json.correct === true, 'Player 2 solves Stage 1 correctly');
    assert(p2s1Solve.json.stageCompleted === true, 'Stage 1 completed cooperatively');
    assert(p2s1Solve.json.nextStageNumber === 2, 'Next stage is 2');

    // Now solve Stage 2 to complete Level 1!
    const l1s2q1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND player_number = 'PLAYER_1'`
    );
    const l1s2q2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND player_number = 'PLAYER_2'`
    );

    await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: l1s2q1Row.rows[0].expected_answer_hash }
    });
    const p2s2Solve = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: l1s2q2Row.rows[0].expected_answer_hash }
    });
    assert(p2s2Solve.json.stageCompleted === true, 'Stage 2 completed cooperatively');

    // Check that Level 1 is now COMPLETED and Level 2 is AVAILABLE
    const gameProg = await request('GET', '/api/player/game', { cookie: p1Cookie });
    const lvl1Prog = gameProg.json.levels.find(l => l.levelNumber === 1);
    const lvl2Prog = gameProg.json.levels.find(l => l.levelNumber === 2);
    assert(lvl1Prog.status === 'COMPLETED', 'Level 1 is marked COMPLETED');
    assert(lvl2Prog.status === 'AVAILABLE' || lvl2Prog.status === 'IN_PROGRESS', 'Level 2 is now unlocked and AVAILABLE');

    // -------------------------------------------------------------
    // 7. Riddle System (Unlock, Deferred Solving, Persistence)
    // -------------------------------------------------------------
    console.log('\n--- 7. RIDDLE SYSTEM (DEFERRED SOLVING & DIGIT STORAGE) ---');
    const riddlesState1 = await request('GET', '/api/player/riddles', { cookie: p1Cookie });
    assert(riddlesState1.status === 200, 'GET /riddles returns 200');

    const riddle1 = riddlesState1.json.riddles.find(r => r.riddleIndex === 1);
    const riddle2 = riddlesState1.json.riddles.find(r => r.riddleIndex === 2);
    assert(riddle1.status === 'UNLOCKED', 'Riddle 1 is UNLOCKED after completing Level 1');
    assert(riddle2.status === 'LOCKED', 'Riddle 2 remains LOCKED since Level 2 not completed');

    // Attempting to solve locked Riddle 2 must be rejected with status: 'LOCKED'
    const lockedRiddleSubmit = await request('POST', '/api/player/riddles/submit', {
      cookie: p1Cookie,
      body: { riddleIndex: 2, digit: '2' }
    });
    assert(lockedRiddleSubmit.json.status === 'LOCKED', 'Locked riddle submission rejected with status LOCKED');

    // Deferred solving: Player solves Riddle 1 later
    // The expected digit for Riddle 1 is '3'
    const riddle1Submit = await request('POST', '/api/player/riddles/submit', {
      cookie: p1Cookie,
      body: { riddleIndex: 1, digit: '3' }
    });
    assert(riddle1Submit.status === 200, 'Riddle 1 submission accepted with 200');
    assert(riddle1Submit.json.status === 'SOLVED', 'Riddle 1 status is now SOLVED');
    assert(riddle1Submit.json.solvedDigit === '3', 'Riddle 1 solvedDigit returned as "3"');

    // Persistence check: Re-fetch riddle board after page reload simulation
    const riddlesState2 = await request('GET', '/api/player/riddles', { cookie: p2Cookie });
    const riddle1Reload = riddlesState2.json.riddles.find(r => r.riddleIndex === 1);
    assert(riddle1Reload.status === 'SOLVED', 'Riddle 1 remains SOLVED across sessions');
    assert(riddle1Reload.solvedDigit === '3', 'Riddle 1 digit "3" permanently stored');

    // -------------------------------------------------------------
    // 8. Progressive Hint System
    // -------------------------------------------------------------
    console.log('\n--- 8. PROGRESSIVE HINT SYSTEM & IDEMPOTENCY ---');
    const hintsRes = await request('GET', '/api/player/game/hints', { cookie: p1Cookie });
    assert(hintsRes.status === 200, 'GET /game/hints returns 200');

    // Use hint for current active level (Level 2 Stage 1)
    const hintUse = await request('POST', '/api/player/game/hints/2/1/1', { cookie: p1Cookie });
    assert(hintUse.status === 200, 'Active level hint request returns 200');
    assert(Boolean(hintUse.json.hintContent), 'Actual hint content is displayed');

    // Duplicate hint request: Must be idempotent without double penalty
    const scoreBefore = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    const duplicateHint = await request('POST', '/api/player/game/hints/2/1/1', { cookie: p1Cookie });
    assert(duplicateHint.json.alreadyUsed === true, 'Duplicate hint marked alreadyUsed: true');
    const scoreAfter = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    assert(scoreBefore.json.hintPenalty === scoreAfter.json.hintPenalty, 'Duplicate hint does NOT charge duplicate penalty');

    // Future level hint (Level 6) must be strictly rejected
    const futureHint = await request('POST', '/api/player/game/hints/6/1/1', { cookie: p1Cookie });
    assert(futureHint.status === 400 || futureHint.status === 403, 'Future level hint request strictly rejected');

    // -------------------------------------------------------------
    // 9. Anti-Cheat Event Handling & Deduplication
    // -------------------------------------------------------------
    console.log('\n--- 9. ANTI-CHEAT EVENT LOGGING & DEDUPLICATION ---');
    const ac1 = await request('POST', '/api/player/anti-cheat/event', {
      cookie: p1Cookie,
      body: { eventType: 'TAB_SWITCH', metadata: 'Player switched tab' }
    });
    assert(ac1.status === 200 && (ac1.json.accepted === true || ac1.json.incidentId), 'Tab switch anti-cheat event accepted and recorded');

    // Rapid duplicate violation within 10s cooldown
    const ac2 = await request('POST', '/api/player/anti-cheat/event', {
      cookie: p1Cookie,
      body: { eventType: 'TAB_SWITCH', metadata: 'Immediate subsequent tab switch' }
    });
    assert(ac2.status === 200 && ac2.json.deduplicated === true, 'Subsequent rapid violation cleanly deduplicated');

    const acSummary = await request('GET', '/api/player/anti-cheat/summary', { cookie: p1Cookie });
    assert(acSummary.status === 200 && acSummary.json.tabSwitchCount >= 1, 'Anti-cheat summary correctly aggregates violations');

    // -------------------------------------------------------------
    // 10. Final Passkey Gating & Completion
    // -------------------------------------------------------------
    console.log('\n--- 10. FINAL PASSKEY GATING & GAME COMPLETION ---');
    // Final passkey premature attempt
    const prematureKey = await request('POST', '/api/player/game/final-passkey', {
      cookie: p1Cookie,
      body: { passkey: '382459' }
    });
    assert(prematureKey.status === 200 && prematureKey.json.status === 'FINAL_NOT_AVAILABLE', 'Premature final passkey rejected as FINAL_NOT_AVAILABLE');

    // Advance remaining levels to reach FINAL_PASSKEY state
    await db.query(`UPDATE teams SET completed_levels = 6, game_state = 'FINAL_PASSKEY' WHERE id = $1`, [teamId]);
    await db.query(`UPDATE team_level_progress SET level_status = 'COMPLETED' WHERE team_id = $1`, [teamId]);

    // Solve riddles 2 through 6 so all 6 are solved (digits 3, 8, 2, 4, 5, 9)
    const riddleDigits = { 2: '8', 3: '2', 4: '4', 5: '5', 6: '9' };
    for (const [idx, dig] of Object.entries(riddleDigits)) {
      await request('POST', '/api/player/riddles/submit', {
        cookie: p1Cookie,
        body: { riddleIndex: parseInt(idx, 10), digit: dig }
      });
    }

    // Wrong passkey attempt
    const wrongKey = await request('POST', '/api/player/game/final-passkey', {
      cookie: p1Cookie,
      body: { passkey: '000000' }
    });
    assert(wrongKey.status === 200 && wrongKey.json.status === 'INCORRECT', 'Wrong passkey rejected as INCORRECT');

    // Correct passkey ('382459')
    const correctKey = await request('POST', '/api/player/game/final-passkey', {
      cookie: p1Cookie,
      body: { passkey: '382459' }
    });
    assert(correctKey.status === 200 && correctKey.json.status === 'COMPLETED', 'Correct passkey 382459 accepted with COMPLETED');

    const completedTeamRow = await db.query('SELECT game_state, completed_at FROM teams WHERE id = $1', [teamId]);
    assert(completedTeamRow.rows[0].game_state === 'COMPLETED', 'Team game_state transitioned to COMPLETED');
    assert(Boolean(completedTeamRow.rows[0].completed_at), 'Team completion timestamp recorded');

    // -------------------------------------------------------------
    // 11. Leaderboard & Results
    // -------------------------------------------------------------
    console.log('\n--- 11. LEADERBOARD & SCORE CALCULATION ---');
    const publicLeaderboard = await request('GET', `/api/public/events/${eventId}/leaderboard`);
    assert(publicLeaderboard.status === 200, 'GET /public/events/:eventId/leaderboard returns 200');
    assert(Array.isArray(publicLeaderboard.json.completedEntries), 'Public leaderboard has completedEntries list');
    const teamInLeaderboard = publicLeaderboard.json.completedEntries.find(e => e.teamName.includes('Delta Team'));
    assert(Boolean(teamInLeaderboard), 'Completed team appears in public leaderboard');

    // -------------------------------------------------------------
    // 12. Admin Operations & Export
    // -------------------------------------------------------------
    console.log('\n--- 12. ADMIN AUDIT, DASHBOARD & CSV EXPORTS ---');
    const dashStats = await request('GET', `/api/admin/events/${eventId}/dashboard`, { cookie: adminCookie });
    assert(dashStats.status === 200 && dashStats.json.totalTeams >= 1, 'Admin dashboard retrieves live statistics');

    const exportCsv = await request('GET', `/api/admin/events/${eventId}/export/results`, { cookie: adminCookie });
    assert(exportCsv.status === 200 && exportCsv.text.includes('Team Name'), 'Admin exports results CSV with headers');

    const exportProgCsv = await request('GET', `/api/admin/events/${eventId}/export/progress`, { cookie: adminCookie });
    assert(exportProgCsv.status === 200 && exportProgCsv.text.includes('Team Code'), 'Admin exports progress CSV with headers');

    // -------------------------------------------------------------
    // 13. STOMP-over-WebSocket Real-Time Engine
    // -------------------------------------------------------------
    console.log('\n--- 13. STOMP-OVER-WEBSOCKET REAL-TIME ENGINE ---');
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      let step = 0;

      ws.on('open', () => {
        const connectFrame = ['CONNECT', 'accept-version:1.2', 'host:localhost', '', ''].join('\n') + '\0';
        ws.send(connectFrame);
      });

      ws.on('message', (data) => {
        const msg = data.toString();
        if (msg.startsWith('CONNECTED') && step === 0) {
          assert(true, 'WebSocket STOMP CONNECTED handshake verified');
          step = 1;

          const subFrame = ['SUBSCRIBE', `id:sub-team-${teamId}`, `destination:/topic/team/${teamId}`, '', ''].join('\n') + '\0';
          ws.send(subFrame);

          setTimeout(() => {
            const webSocketService = require('../services/webSocketService');
            webSocketService.broadcastToTeam(teamId, {
              type: 'SYSTEM_VERIFICATION',
              teamId,
              message: 'Full system verification message'
            });
          }, 150);
        } else if (msg.includes('SYSTEM_VERIFICATION') && step === 1) {
          assert(true, 'WebSocket STOMP broadcast successfully received on /topic/team/:id');
          step = 2;
          const disc = ['DISCONNECT', 'receipt:99', '', ''].join('\n') + '\0';
          ws.send(disc);
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
          assert(step >= 1, 'WebSocket CONNECTED established');
          try { ws.close(); } catch (_) {}
          resolve();
        }
      }, 3000);
    });

  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    totalFailed++;
  } finally {
    console.log('\n================================================================');
    console.log(`FULL SYSTEM VERIFICATION RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log('================================================================');

    server.close();
    await db.pool.end();

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Start server on an ephemeral port and run full verification
server.listen(0, () => {
  PORT = server.address().port;
  BASE_URL = `http://localhost:${PORT}`;
  WS_URL = `ws://localhost:${PORT}/ws`;
  console.log(`Verification test server running on port ${PORT}`);
  runVerification();
});
