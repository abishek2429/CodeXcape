const assert = require('assert');
const http = require('http');
const db = require('../config/db');
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

async function runGameProgressionAndResetSuite() {
  try {
    console.log('====================================================');
    console.log('CODEXCAPE GAME PROGRESSION & ADMIN RESET VERIFICATION');
    console.log('====================================================');

    // 1. Admin login & create event + team
    console.log('\n--- 1. SETUP EVENT & TEAM ---');
    const adminLogin = await request('POST', '/api/admin/login', {
      body: { password: 'admin123' }
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login returns 200');
    const adminCookie = adminLogin.cookie;

    const eventRes = await request('POST', '/api/admin/events', {
      cookie: adminCookie,
      body: { name: 'Progression Test Event ' + Date.now(), totalLevels: 6 }
    });
    assert.strictEqual(eventRes.status, 201, 'Create event returns 201');
    const eventId = eventRes.json.id;

    await request('POST', `/api/admin/events/${eventId}/start`, { cookie: adminCookie });

    const uniqueCode = 'TEST' + Date.now().toString().slice(-5);
    const teamRes = await request('POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: {
        customTeamCode: uniqueCode,
        teamName: 'Progression Team ' + uniqueCode,
        player1DisplayName: 'Op 1',
        player2DisplayName: 'Op 2'
      }
    });
    assert.strictEqual(teamRes.status, 201, 'Team created');
    const teamId = teamRes.json.id;
    const teamCode = teamRes.json.teamCode;

    // 2. Both players login, confirm readiness, and start game
    console.log('\n--- 2. PLAYER LOBBY & GAME INITIALIZATION ---');
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

    // Confirm readiness
    await request('POST', '/api/player/ready', {
      cookie: p1Cookie,
      body: { isReady: true }
    });
    await request('POST', '/api/player/ready', {
      cookie: p2Cookie,
      body: { isReady: true }
    });

    // Start game
    const startRes = await request('POST', '/api/player/event/start', {
      cookie: p1Cookie
    });
    assert.strictEqual(startRes.status, 200, 'Event start returns 200');
    console.log('  ✓ Game started successfully: gameState = IN_PROGRESS');

    // 3. Stage 1 Question and Answer Submission
    console.log('\n--- 3. STAGE 1 SUBMISSION & COOPERATIVE PROGRESSION ---');
    const q1Res = await request('GET', '/api/player/game/current/question', { cookie: p1Cookie });
    assert.strictEqual(q1Res.status, 200, 'P1 gets current question');
    assert.strictEqual(q1Res.json.levelNumber, 1, 'Current level is 1');
    assert.strictEqual(q1Res.json.stageNumber, 1, 'Current stage is 1');
    assert.strictEqual(q1Res.json.isCompleted, false, 'P1 stage 1 initially not completed');

    // Fetch expected answers from DB
    const l1s1q1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND (player_number = 'PLAYER_1' OR player_number = '1')`
    );
    const l1s1q2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 1 AND (player_number = 'PLAYER_2' OR player_number = '2')`
    );
    const ans1 = l1s1q1Row.rows[0].expected_answer_hash;
    const ans2 = l1s1q2Row.rows[0].expected_answer_hash;

    // Player 1 submits answer for Stage 1
    const p1Sub1 = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: ans1 }
    });
    assert.strictEqual(p1Sub1.status, 200, 'P1 submit returns 200');
    assert.strictEqual(p1Sub1.json.correct, true, 'P1 answer is correct');
    assert.strictEqual(p1Sub1.json.stageCompleted, false, 'Stage not completed yet (waiting for P2)');
    assert.strictEqual(p1Sub1.json.levelCompleted, false, 'Level not completed');
    console.log('  ✓ P1 submitted Stage 1: stageCompleted=false, levelCompleted=false (waiting for P2)');

    // Player 2 submits answer for Stage 1
    const p2Sub1 = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: ans2 }
    });
    assert.strictEqual(p2Sub1.status, 200, 'P2 submit returns 200');
    assert.strictEqual(p2Sub1.json.correct, true, 'P2 answer is correct');
    assert.strictEqual(p2Sub1.json.stageCompleted, true, 'Stage 1 is now completed!');
    assert.strictEqual(p2Sub1.json.levelCompleted, false, 'Level 1 is NOT yet completed (Stage 2 remains)');
    assert.strictEqual(p2Sub1.json.nextStageNumber, 2, 'Next stage number is 2');
    console.log('  ✓ P2 submitted Stage 1: stageCompleted=true, levelCompleted=false, nextStageNumber=2');

    // Verify stage points were awarded exactly once (+60 pts)
    const scoreRes1 = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    assert.strictEqual(scoreRes1.status, 200, 'Score returns 200');
    assert.strictEqual(scoreRes1.json.baseScore, 60, 'Base score is 60 for Stage 1 completion');
    console.log('  ✓ Base score awarded exactly once: 60 pts');

    // 4. Duplicate Submission Protection
    console.log('\n--- 4. DUPLICATE SUBMISSION TEST ---');
    const p1Dup = await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: ans1, stageNumber: 1 }
    });
    assert.strictEqual(p1Dup.status, 200, 'Duplicate submit returns 200');
    assert.strictEqual(p1Dup.json.correct, true, 'Duplicate returns correct');
    const scoreResDup = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    assert.strictEqual(scoreResDup.json.baseScore, 60, 'Score remains 60, no double points');
    console.log('  ✓ Duplicate submission ignored: points not awarded twice');

    // 5. Stage 2 Playable
    console.log('\n--- 5. STAGE 2 TRANSITION & COMPLETION ---');
    const q2P1 = await request('GET', '/api/player/game/current/question', { cookie: p1Cookie });
    assert.strictEqual(q2P1.status, 200, 'P1 gets Stage 2 question');
    assert.strictEqual(q2P1.json.levelNumber, 1, 'Still Level 1');
    assert.strictEqual(q2P1.json.stageNumber, 2, 'Stage is now 2');
    assert.strictEqual(q2P1.json.isCompleted, false, 'Stage 2 is fresh / not completed');
    console.log('  ✓ Stage 2 is authoritative and playable');

    // Submit Stage 2 answers (final stage of Level 1)
    const l1s2q1Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND (player_number = 'PLAYER_1' OR player_number = '1')`
    );
    const l1s2q2Row = await db.query(
      `SELECT expected_answer_hash FROM questions WHERE level_id = 1 AND stage_number = 2 AND (player_number = 'PLAYER_2' OR player_number = '2')`
    );
    const ans2_1 = l1s2q1Row.rows[0].expected_answer_hash;
    const ans2_2 = l1s2q2Row.rows[0].expected_answer_hash;

    await request('POST', '/api/player/game/current/answer', {
      cookie: p1Cookie,
      body: { answer: ans2_1 }
    });

    const p2Sub2 = await request('POST', '/api/player/game/current/answer', {
      cookie: p2Cookie,
      body: { answer: ans2_2 }
    });
    assert.strictEqual(p2Sub2.status, 200, 'Stage 2 completion returns 200');
    assert.strictEqual(p2Sub2.json.stageCompleted, true, 'Stage completed is true');
    assert.strictEqual(p2Sub2.json.levelCompleted, true, 'Level completed is TRUE for final stage!');
    assert.strictEqual(p2Sub2.json.nextStageNumber, null, 'nextStageNumber is null on level complete');
    console.log('  ✓ Level 1 fully completed: levelCompleted=true, nextStageNumber=null');

    // Verify Level 1 is COMPLETED and Level 2 is AVAILABLE in DB
    const stateRes = await request('GET', '/api/player/game', { cookie: p1Cookie });
    assert.strictEqual(stateRes.json.currentLevel, 2, 'Game advanced to Level 2');
    console.log('  ✓ Authoritative state advanced to Level 2');

    // 6. Use hint on Level 2 to add penalty and create dirty progress
    console.log('\n--- 6. DIRTY PROGRESS (Hints & Riddles) ---');
    const hintRes = await request('POST', '/api/player/game/hints/2/1/1', {
      cookie: p1Cookie
    });
    assert.strictEqual(hintRes.status, 200, 'Hint revealed');
    const scoreWithHint = await request('GET', '/api/player/game/score', { cookie: p1Cookie });
    assert.strictEqual(scoreWithHint.json.hintPenalty, 5, 'Hint penalty recorded (-5 pts)');
    assert(scoreWithHint.json.finalScore > 0, 'Team has non-zero score before reset');
    console.log(`  ✓ Team has dirty progress: Base=${scoreWithHint.json.baseScore}, HintPenalty=${scoreWithHint.json.hintPenalty}, FinalScore=${scoreWithHint.json.finalScore}`);

    // 7. Security: Normal player cannot execute reset
    console.log('\n--- 7. SECURITY: NON-ADMIN RESET REJECTION ---');
    const unauthReset = await request('POST', '/api/admin/sessions/reset-all', {
      cookie: p1Cookie
    });
    assert(unauthReset.status === 401 || unauthReset.status === 403, 'Non-admin reset rejected with 401/403');
    console.log('  ✓ Security check passed: normal players rejected from reset endpoint');

    // 8. Admin Reset Execution
    console.log('\n--- 8. ADMIN RESET EXECUTION ---');
    const resetRes = await request('POST', '/api/admin/sessions/reset-all', {
      cookie: adminCookie
    });
    assert.strictEqual(resetRes.status, 200, 'Admin reset returns 200');
    console.log('  ✓ Admin reset executed successfully:', resetRes.json.message);

    // 9. Verify Database Directly
    console.log('\n--- 9. AUTHORITATIVE DATABASE VERIFICATION ---');
    const dbTeam = (await db.query(`SELECT * FROM teams WHERE id = $1`, [teamId])).rows[0];
    assert.strictEqual(parseInt(dbTeam.base_score, 10), 0, 'team.base_score === 0');
    assert.strictEqual(parseInt(dbTeam.wrong_attempt_penalty, 10), 0, 'team.wrong_attempt_penalty === 0');
    assert.strictEqual(parseInt(dbTeam.hint_penalty, 10), 0, 'team.hint_penalty === 0');
    assert.strictEqual(parseInt(dbTeam.anti_cheat_penalty, 10), 0, 'team.anti_cheat_penalty === 0');
    assert.strictEqual(parseInt(dbTeam.final_score, 10), 0, 'team.final_score === 0');
    assert.strictEqual(parseInt(dbTeam.completed_mini_games, 10), 0, 'team.completed_mini_games === 0');
    assert.strictEqual(parseInt(dbTeam.completed_levels, 10), 0, 'team.completed_levels === 0');
    assert.strictEqual(dbTeam.game_state, 'NOT_STARTED', 'team.game_state === NOT_STARTED');
    assert.strictEqual(dbTeam.started_at, null, 'team.started_at === null');
    assert.strictEqual(dbTeam.completed_at, null, 'team.completed_at === null');
    assert.strictEqual(dbTeam.current_story_key, null, 'team.current_story_key === null');
    console.log('  ✓ Database teams table verified: Score=0, State=NOT_STARTED, StartedAt=null');

    // Level progress check
    const dbLevels = (await db.query(`SELECT tlp.*, l.level_number FROM team_level_progress tlp JOIN levels l ON tlp.level_id = l.id WHERE tlp.team_id = $1 ORDER BY l.level_number ASC`, [teamId])).rows;
    for (const lvl of dbLevels) {
      if (lvl.level_number === 1) {
        assert.strictEqual(lvl.level_status, 'AVAILABLE', 'Level 1 is AVAILABLE');
      } else {
        assert.strictEqual(lvl.level_status, 'LOCKED', `Level ${lvl.level_number} is LOCKED`);
      }
      assert.strictEqual(lvl.player1_completed, false, `Level ${lvl.level_number} player1_completed=false`);
      assert.strictEqual(lvl.player2_completed, false, `Level ${lvl.level_number} player2_completed=false`);
      assert.strictEqual(lvl.completed_at, null, `Level ${lvl.level_number} completed_at=null`);
    }
    console.log('  ✓ Database team_level_progress verified: Level 1 AVAILABLE, Levels 2-6 LOCKED');

    // Stage progress check
    const dbStages = (await db.query(`SELECT * FROM team_stage_progress WHERE team_id = $1`, [teamId])).rows;
    for (const sp of dbStages) {
      assert.strictEqual(sp.player1_completed, false, `Stage ${sp.stage_number} player1_completed=false`);
      assert.strictEqual(sp.player2_completed, false, `Stage ${sp.stage_number} player2_completed=false`);
      assert.strictEqual(sp.completed_at, null, `Stage ${sp.stage_number} completed_at=null`);
    }
    console.log('  ✓ Database team_stage_progress verified: all player completed flags = false');

    // Riddles check
    const dbRiddles = (await db.query(`SELECT * FROM team_riddle_progress WHERE team_id = $1`, [teamId])).rows;
    assert.strictEqual(dbRiddles.length, 0, 'team_riddle_progress has 0 rows (all riddles locked)');
    console.log('  ✓ Database team_riddle_progress verified: 0 rows (all 6 riddles locked)');

    // Hints check
    const dbHints = (await db.query(`SELECT * FROM hint_usage WHERE team_id = $1`, [teamId])).rows;
    assert.strictEqual(dbHints.length, 0, 'hint_usage has 0 rows (all hints unrevealed)');
    console.log('  ✓ Database hint_usage verified: 0 rows (all hints unrevealed)');

    // Score events check
    const dbScoreEvents = (await db.query(`SELECT * FROM score_events WHERE team_id = $1`, [teamId])).rows;
    assert.strictEqual(dbScoreEvents.length, 0, 'score_events has 0 rows');
    console.log('  ✓ Database score_events verified: 0 rows');

    // Players check
    const dbPlayers = (await db.query(`SELECT * FROM players WHERE team_id = $1`, [teamId])).rows;
    for (const p of dbPlayers) {
      assert.strictEqual(p.is_ready, false, `Player ${p.player_number} is_ready=false`);
      assert.strictEqual(p.status, 'INACTIVE', `Player ${p.player_number} status=INACTIVE`);
    }
    console.log('  ✓ Database players verified: is_ready=false, status=INACTIVE');

    // 10. Re-login & Refresh: Old Data Must NOT Return
    console.log('\n--- 10. RE-LOGIN & REFRESH VERIFICATION ---');
    const freshP1Login = await request('POST', '/api/player/login', {
      body: { teamCode, playerNumber: 1 }
    });
    assert.strictEqual(freshP1Login.status, 200, 'P1 re-login returns 200');
    const freshP1Cookie = freshP1Login.cookie;

    // Check lobby
    const freshLobby = await request('GET', '/api/player/lobby', { cookie: freshP1Cookie });
    assert.strictEqual(freshLobby.json.gameState, 'NOT_STARTED', 'Lobby gameState is NOT_STARTED');
    assert.strictEqual(freshLobby.json.isReady, false, 'P1 isReady is false');
    assert.strictEqual(freshLobby.json.currentLevel, 1, 'Current level is 1');
    assert.strictEqual(freshLobby.json.currentStage, 1, 'Current stage is 1');

    // Check score
    const freshScore = await request('GET', '/api/player/game/score', { cookie: freshP1Cookie });
    assert.strictEqual(freshScore.json.finalScore, 0, 'Score is strictly 0');
    assert.strictEqual(freshScore.json.baseScore, 0, 'Base score is strictly 0');
    assert.strictEqual(freshScore.json.hintPenalty, 0, 'Hint penalty is 0');

    // Check riddles
    const freshRiddles = await request('GET', '/api/player/riddles', { cookie: freshP1Cookie });
    assert.strictEqual(freshRiddles.json.solvedCount, 0, 'Solved riddles count is 0');
    assert.strictEqual(freshRiddles.json.unlockedCount, 0, 'Unlocked riddles count is 0');
    for (const item of freshRiddles.json.riddles) {
      assert.strictEqual(item.status, 'LOCKED', `Riddle ${item.riddleIndex} is LOCKED`);
    }
    console.log('  ✓ Re-login verified: Score=0, Lobby=NOT_STARTED, Hints=0, All 6 Riddles=LOCKED');

    // 11. Reset Twice Protection
    console.log('\n--- 11. RESET TWICE IDEMPOTENCY ---');
    const resetRes2 = await request('POST', '/api/admin/sessions/reset-all', {
      cookie: adminCookie
    });
    assert.strictEqual(resetRes2.status, 200, 'Second reset returns 200 without error');
    const dbTeam2 = (await db.query(`SELECT * FROM teams WHERE id = $1`, [teamId])).rows[0];
    assert.strictEqual(parseInt(dbTeam2.final_score, 10), 0, 'Score remains 0 after second reset');
    assert.strictEqual(dbTeam2.game_state, 'NOT_STARTED', 'State remains NOT_STARTED');
    console.log('  ✓ Second reset executed cleanly with zero corruption');

    console.log('\n====================================================');
    console.log('ALL GAME PROGRESSION & RESET VERIFICATIONS PASSED ✓');
    console.log('====================================================\n');
    return true;
  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
    throw err;
  }
}

async function main() {
  if (!server.listening) {
    await new Promise((resolve) => {
      server.listen(0, () => {
        PORT = server.address().port;
        console.log(`Test server running on port ${PORT}`);
        resolve();
      });
    });
  } else {
    PORT = server.address().port;
  }

  try {
    await runGameProgressionAndResetSuite();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

main();
