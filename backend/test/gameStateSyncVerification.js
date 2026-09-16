const assert = require('assert');
const http = require('http');
const db = require('../config/db');
const initSchema = require('../config/initSchema');
const { app, server } = require('../server');

let PORT;

function request(method, path, options = {}) {
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
        port: PORT,
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

async function runGameStateSyncVerification() {
  console.log('====================================================');
  console.log('CODEXCAPE GAME STATE SYNC, CONCURRENCY & PROGRESSION TEST');
  console.log('====================================================');

  try {
    // 1. Admin login and event setup
    console.log('\n--- STEP 1: CREATE TEST EVENT AND TEAM ---');
    const adminLogin = await request('POST', '/api/admin/login', {
      body: { password: 'admin123' }
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login returns 200');
    const adminCookie = adminLogin.cookie;

    const eventRes = await request('POST', '/api/admin/events', {
      cookie: adminCookie,
      body: { name: 'Sync Test Event ' + Date.now(), totalLevels: 6 }
    });
    assert.strictEqual(eventRes.status, 201, 'Create event returns 201');
    const eventId = eventRes.json.id;

    await request('POST', `/api/admin/events/${eventId}/start`, { cookie: adminCookie });

    const uniqueCode = 'SYNC' + Date.now().toString().slice(-4);
    const teamRes = await request('POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: {
        customTeamCode: uniqueCode,
        teamName: 'Sync Team ' + uniqueCode,
        player1DisplayName: 'Alice',
        player2DisplayName: 'Bob'
      }
    });
    assert.strictEqual(teamRes.status, 201, 'Team created');
    const teamId = teamRes.json.id;
    const teamCode = teamRes.json.teamCode;

    // 2. Both players login, confirm readiness, and start event
    console.log('\n--- STEP 2: PLAYER AUTHENTICATION & INITIAL STATE ---');
    const p1Login = await request('POST', '/api/player/login', {
      body: { teamCode, playerNumber: 1 }
    });
    assert.strictEqual(p1Login.status, 200, 'P1 login returns 200');
    const p1Cookie = p1Login.cookie;

    const p2Login = await request('POST', '/api/player/login', {
      body: { teamCode, playerNumber: 2 }
    });
    assert.strictEqual(p2Login.status, 200, 'P2 login returns 200');
    const p2Cookie = p2Login.cookie;

    // Ready up
    await request('POST', '/api/player/ready', { cookie: p1Cookie, body: { isReady: true } });
    await request('POST', '/api/player/ready', { cookie: p2Cookie, body: { isReady: true } });

    // Start event
    const startRes = await request('POST', '/api/player/event/start', { cookie: p1Cookie });
    assert.strictEqual(startRes.status, 200, 'Event start returns 200');

    // 3. Verify initial state and stateVersion
    console.log('\n--- STEP 3: INITIAL GAME STATE & VERSION CHECK ---');
    const p1State = await request('GET', '/api/player/game', { cookie: p1Cookie });
    const p2State = await request('GET', '/api/player/game', { cookie: p2Cookie });
    assert.strictEqual(p1State.status, 200);
    assert.strictEqual(p2State.status, 200);
    assert.strictEqual(p1State.json.currentLevel, 1);
    assert.strictEqual(p2State.json.currentLevel, 1);
    assert.ok(p1State.json.stateVersion >= 1, 'Initial stateVersion exists and >= 1');
    assert.strictEqual(p1State.json.stateVersion, p2State.json.stateVersion, 'P1 and P2 share same stateVersion');
    console.log(`  ✓ Initial state synchronized: Level 1, stateVersion=${p1State.json.stateVersion}`);

    // 4. Verify Asymmetric Stage 1 Questions (No Leaks)
    console.log('\n--- STEP 4: ASYMMETRIC STAGE 1 TELEMETRY VERIFICATION ---');
    const [p1Q1, p2Q1] = await Promise.all([
      request('GET', '/api/player/game/current/question', { cookie: p1Cookie }),
      request('GET', '/api/player/game/current/question', { cookie: p2Cookie })
    ]);

    assert.strictEqual(p1Q1.status, 200, 'P1 gets stage 1 question');
    assert.strictEqual(p2Q1.status, 200, 'P2 gets stage 1 question');
    assert.strictEqual(p1Q1.json.levelNumber, 1);
    assert.strictEqual(p2Q1.json.levelNumber, 1);
    assert.strictEqual(p1Q1.json.stageNumber, 1);
    assert.strictEqual(p2Q1.json.stageNumber, 1);
    assert.notStrictEqual(p1Q1.json.evidence, p2Q1.json.evidence, 'Asymmetric evidence is unique per player');
    console.log('  ✓ Asymmetric questions delivered successfully without data leakage');

    // Get expected answers from DB
    const l1s1p1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND (player_number = 'PLAYER_1' OR player_number = '1')`
    );
    const l1s1p2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND (player_number = 'PLAYER_2' OR player_number = '2')`
    );
    const p1Ans1 = l1s1p1Row.rows[0].expected_answer_hash;
    const p2Ans1 = l1s1p2Row.rows[0].expected_answer_hash;

    // 5. Test High-Concurrency Double Submissions (5 concurrent identical submissions)
    console.log('\n--- STEP 5: HIGH-CONCURRENCY DOUBLE-SUBMISSION RESILIENCE ---');
    const initialScoreRes = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    const initialScore = initialScoreRes.json.finalScore || 0;

    // P1 fires 5 concurrent identical answer submissions
    const concurrentSubmissions = await Promise.all([
      request('POST', '/api/player/game/current/answer', { cookie: p1Cookie, body: { answer: p1Ans1, stageNumber: 1 } }),
      request('POST', '/api/player/game/current/answer', { cookie: p1Cookie, body: { answer: p1Ans1, stageNumber: 1 } }),
      request('POST', '/api/player/game/current/answer', { cookie: p1Cookie, body: { answer: p1Ans1, stageNumber: 1 } }),
      request('POST', '/api/player/game/current/answer', { cookie: p1Cookie, body: { answer: p1Ans1, stageNumber: 1 } }),
      request('POST', '/api/player/game/current/answer', { cookie: p1Cookie, body: { answer: p1Ans1, stageNumber: 1 } }),
    ]);

    // All should return 200 without crashing or deadlocking
    concurrentSubmissions.forEach((sub, idx) => {
      assert.strictEqual(sub.status, 200, `Concurrent sub ${idx} returned 200`);
      assert.strictEqual(sub.json.correct, true, `Concurrent sub ${idx} marked correct`);
      assert.strictEqual(sub.json.stageCompleted, false, `Stage not completed yet (P2 hasn't submitted)`);
    });
    console.log('  ✓ All 5 concurrent identical submissions succeeded without deadlocks or errors');

    // 6. Simultaneous Submissions from Player 1 and Player 2
    console.log('\n--- STEP 6: SIMULTANEOUS COOPERATIVE SUBMISSION ---');
    // Now P2 submits to complete Stage 1
    const p2Sub1 = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: p2Ans1, stageNumber: 1 }
    });
    assert.strictEqual(p2Sub1.status, 200);
    assert.strictEqual(p2Sub1.json.correct, true);
    assert.strictEqual(p2Sub1.json.stageCompleted, true, 'Stage 1 is completed');
    assert.strictEqual(p2Sub1.json.nextStageNumber, 2, 'Next stage is 2');
    assert.ok(p2Sub1.json.stateVersion > p1State.json.stateVersion, 'stateVersion incremented');
    console.log(`  ✓ Stage 1 completed. New stateVersion=${p2Sub1.json.stateVersion}, Score=${p2Sub1.json.finalScore}`);

    // Verify points were awarded exactly once (60 points for Stage 1)
    const afterStage1Score = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    assert.strictEqual(afterStage1Score.json.baseScore, 60, 'Base score is exactly 60');

    // 7. Verify Immediate Stage 2 Availability for Both Players
    console.log('\n--- STEP 7: STAGE 2 COOPERATIVE RETRIEVAL ---');
    const [p1Q2, p2Q2] = await Promise.all([
      request('GET', '/api/player/game/current/question', { cookie: p1Cookie }),
      request('GET', '/api/player/game/current/question', { cookie: p2Cookie })
    ]);

    assert.strictEqual(p1Q2.status, 200, 'P1 gets stage 2');
    assert.strictEqual(p2Q2.status, 200, 'P2 gets stage 2');
    assert.strictEqual(p1Q2.json.stageNumber, 2, 'P1 on stage 2');
    assert.strictEqual(p2Q2.json.stageNumber, 2, 'P2 on stage 2');
    assert.strictEqual(p1Q2.json.isCompleted, false, 'P1 stage 2 is uncompleted');
    assert.strictEqual(p2Q2.json.isCompleted, false, 'P2 stage 2 is uncompleted');
    console.log('  ✓ Both players smoothly transitioned to Stage 2');

    // Get Stage 2 answers (final stage of Level 1)
    const l1s2p1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND (player_number = 'PLAYER_1' OR player_number = '1')`
    );
    const l1s2p2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND (player_number = 'PLAYER_2' OR player_number = '2')`
    );
    const p1Ans2 = l1s2p1Row.rows[0].expected_answer_hash;
    const p2Ans2 = l1s2p2Row.rows[0].expected_answer_hash;

    // 8. Atomic Level Completion (Level 1 -> Level 2)
    console.log('\n--- STEP 8: ATOMIC LEVEL COMPLETION (LEVEL 1 -> LEVEL 2) ---');
    const p1Sub2 = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: p1Ans2, stageNumber: 2 }
    });
    assert.strictEqual(p1Sub2.status, 200);

    const p2Sub2 = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: p2Ans2, stageNumber: 2 }
    });
    assert.strictEqual(p2Sub2.status, 200);
    assert.strictEqual(p2Sub2.json.stageCompleted, true, 'Stage 2 completed');
    assert.strictEqual(p2Sub2.json.levelCompleted, true, 'Level 1 completed!');
    console.log(`  ✓ Level 1 completed! Response: currentLevel=${p2Sub2.json.currentLevel}, stateVersion=${p2Sub2.json.stateVersion}`);

    // 9. NO TELEMETRY DISRUPTION: Fetch Level 2 Stage 1 Immediately for Both Players
    console.log('\n--- STEP 9: ZERO-LATENCY LEVEL 2 STAGE 1 RETRIEVAL (NO TELEMETRY DISRUPTION) ---');
    const [l2P1Q1, l2P2Q1, l2StateP1, l2StateP2] = await Promise.all([
      request('GET', '/api/player/game/current/question', { cookie: p1Cookie }),
      request('GET', '/api/player/game/current/question', { cookie: p2Cookie }),
      request('GET', '/api/player/game', { cookie: p1Cookie }),
      request('GET', '/api/player/game', { cookie: p2Cookie })
    ]);

    assert.strictEqual(l2StateP1.status, 200, 'P1 game state returns 200');
    assert.strictEqual(l2StateP2.status, 200, 'P2 game state returns 200');
    assert.strictEqual(l2StateP1.json.currentLevel, 2, 'P1 currentLevel is 2');
    assert.strictEqual(l2StateP2.json.currentLevel, 2, 'P2 currentLevel is 2');

    assert.strictEqual(l2P1Q1.status, 200, 'P1 gets Level 2 Stage 1 question immediately with 200');
    assert.strictEqual(l2P2Q1.status, 200, 'P2 gets Level 2 Stage 1 question immediately with 200');
    assert.strictEqual(l2P1Q1.json.levelNumber, 2, 'P1 is on Level 2');
    assert.strictEqual(l2P2Q1.json.levelNumber, 2, 'P2 is on Level 2');
    assert.strictEqual(l2P1Q1.json.stageNumber, 1, 'P1 is on Stage 1');
    assert.strictEqual(l2P2Q1.json.stageNumber, 1, 'P2 is on Stage 1');
    assert.notStrictEqual(l2P1Q1.json.evidence, l2P2Q1.json.evidence, 'Level 2 asymmetric evidence is preserved');
    console.log('  ✓ Level 2 Stage 1 question available immediately for both players with zero telemetry disruption!');

    // 10. Story Dialogue Idempotency and Skip
    console.log('\n--- STEP 10: CINEMATIC STORY IDEMPOTENCY & SKIP FLOW ---');
    // Level 1 completion triggered STORY_L2_INTRO automatically
    const storyCurrentP1 = await request('GET', '/api/player/game/story/current', { cookie: p1Cookie });
    assert.strictEqual(storyCurrentP1.status, 200, 'Current story returns 200');
    assert.strictEqual(storyCurrentP1.json.isStoryActive, true, 'Story is active for Level 2 intro');
    assert.strictEqual(storyCurrentP1.json.storyKey, 'STORY_L2_INTRO');
    assert.ok(storyCurrentP1.json.eventId, 'Deterministic eventId is present');

    // Skip story
    const skipStoryRes1 = await request('POST', '/api/player/game/story/skip', {
      cookie: p1Cookie,
      body: {}
    });
    assert.strictEqual(skipStoryRes1.status, 200, 'Skip story returns 200');
    assert.strictEqual(skipStoryRes1.json.isStoryActive, false, 'Story marked inactive');

    // Duplicate skip story call (idempotent)
    const skipStoryRes2 = await request('POST', '/api/player/game/story/skip', {
      cookie: p2Cookie,
      body: {}
    });
    assert.strictEqual(skipStoryRes2.status, 200, 'Duplicate skip returns 200');
    assert.strictEqual(skipStoryRes2.json.isStoryActive, false);
    console.log('  ✓ Story start and skip are strictly idempotent and synchronized');

    // 11. Full Resync Endpoint Verification
    console.log('\n--- STEP 11: FULL RESYNC ENDPOINT VERIFICATION ---');
    const resyncRes = await request('GET', '/api/player/game/resync', { cookie: p1Cookie });
    assert.strictEqual(resyncRes.status, 200, 'Resync endpoint returns 200');
    assert.strictEqual(resyncRes.json.currentLevel, 2);
    assert.strictEqual(resyncRes.json.currentStage, 1);
    assert.ok(resyncRes.json.teamScore !== undefined, 'teamScore present in resync');
    assert.ok(resyncRes.json.stateVersion !== undefined, 'stateVersion present in resync');
    console.log(`  ✓ Resync endpoint verified: currentLevel=${resyncRes.json.currentLevel}, currentStage=${resyncRes.json.currentStage}, score=${resyncRes.json.teamScore?.finalScore}`);

    console.log('\n====================================================');
    console.log('ALL GAME STATE SYNC & PROGRESSION TESTS PASSED! (11/11)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    throw err;
  }
}

async function main() {
  await initSchema();
  await new Promise((resolve) => {
    server.listen(0, () => {
      PORT = server.address().port;
      console.log(`Test server running on port ${PORT}`);
      resolve();
    });
  });

  try {
    await runGameStateSyncVerification();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  } finally {
    server.close();
  }
}

main();
