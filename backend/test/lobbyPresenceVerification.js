const assert = require('assert');
const http = require('http');
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

async function runLobbyPresenceSuite() {
  try {
    console.log('====================================================');
    console.log('CODEXCAPE LOBBY PRESENCE & READINESS VERIFICATION');
    console.log('====================================================');

    // 1. Admin login & create event + teams
    const adminLogin = await request('POST', '/api/admin/login', {
      body: { password: 'admin123' }
    });
    assert(adminLogin.status === 200, 'Admin login returns 200');
    const adminCookie = adminLogin.cookie;

    const eventRes = await request('POST', '/api/admin/events', {
      cookie: adminCookie,
      body: { name: 'Lobby Test Event ' + Date.now(), totalLevels: 6 }
    });
    assert(eventRes.status === 201, 'Create event returns 201');
    const eventId = eventRes.json.id;

    await request('POST', `/api/admin/events/${eventId}/start`, { cookie: adminCookie });

    // Create Team Alpha with unique code
    const uniqueAlpha = 'ALPHA' + Date.now().toString().slice(-5);
    const teamAlphaRes = await request('POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: { customTeamCode: uniqueAlpha, teamName: 'Team Alpha ' + uniqueAlpha, player1DisplayName: 'Operator 01', player2DisplayName: 'Operator 02' }
    });
    assert(teamAlphaRes.status === 201, 'Team Alpha created');
    const teamAlphaCode = teamAlphaRes.json.teamCode;

    // Create Team Beta with unique code (for isolation testing)
    const uniqueBeta = 'BETA' + Date.now().toString().slice(-5);
    const teamBetaRes = await request('POST', `/api/admin/events/${eventId}/teams`, {
      cookie: adminCookie,
      body: { customTeamCode: uniqueBeta, teamName: 'Team Beta ' + uniqueBeta, player1DisplayName: 'Beta Op 1', player2DisplayName: 'Beta Op 2' }
    });
    assert(teamBetaRes.status === 201, 'Team Beta created');
    const teamBetaCode = teamBetaRes.json.teamCode;

    console.log('\n--- 1. INITIAL STATE (Before any logins) ---');
    // Login Browser A as Operator 01
    const p1Login = await request('POST', '/api/player/login', {
      body: { teamCode: teamAlphaCode, playerNumber: 1 }
    });
    assert(p1Login.status === 200, 'Player 1 login returns 200');
    const p1Cookie = p1Login.cookie;
    const p1Lobby = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    assert(p1Lobby.status === 200, 'Player 1 gets lobby state');
    
    // Check initial presence when partner has not logged in yet
    console.log('Player 1 lobby view before Player 2 logs in:');
    assert.strictEqual(p1Lobby.json.playerNumber, 1, 'Self is player 1');
    assert.strictEqual(p1Lobby.json.isReady, false, 'Self readiness is initially false');
    assert.strictEqual(p1Lobby.json.teammateLoggedIn, false, 'Teammate is correctly NOT logged in yet');
    assert.strictEqual(p1Lobby.json.teammateReady, false, 'Teammate is NOT ready');
    assert.strictEqual(p1Lobby.json.players[0].online, true, 'Player 1 is online');
    assert.strictEqual(p1Lobby.json.players[1].online, false, 'Player 2 is offline');
    console.log('  ✓ PASS: Player 1 sees Operator 01 LOGGED IN and Operator 02 NOT LOGGED IN');

    console.log('\n--- 2. DUAL PLAYER PRESENCE (Both logged in from separate browsers) ---');
    // Login Browser B as Operator 02
    const p2Login = await request('POST', '/api/player/login', {
      body: { teamCode: teamAlphaCode, playerNumber: 2 }
    });
    assert(p2Login.status === 200, 'Player 2 login returns 200');
    const p2Cookie = p2Login.cookie;

    // Browser A refreshes lobby
    const p1LobbyAfterP2 = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    // Browser B checks lobby
    const p2Lobby = await request('GET', '/api/player/lobby', { cookie: p2Cookie });

    // Assert Browser A view
    assert.strictEqual(p1LobbyAfterP2.json.playerNumber, 1, 'Browser A is Operator 01');
    assert.strictEqual(p1LobbyAfterP2.json.isReady, false, 'Browser A Operator 01 readiness is false');
    assert.strictEqual(p1LobbyAfterP2.json.teammateLoggedIn, true, 'Browser A sees Operator 02 LOGGED IN');
    assert.strictEqual(p1LobbyAfterP2.json.teammateReady, false, 'Browser A sees Operator 02 NOT READY');
    assert.strictEqual(p1LobbyAfterP2.json.players[0].online, true, 'Browser A: Player 1 online');
    assert.strictEqual(p1LobbyAfterP2.json.players[1].online, true, 'Browser A: Player 2 online');

    // Assert Browser B view
    assert.strictEqual(p2Lobby.json.playerNumber, 2, 'Browser B is Operator 02');
    assert.strictEqual(p2Lobby.json.isReady, false, 'Browser B Operator 02 readiness is false');
    assert.strictEqual(p2Lobby.json.teammateLoggedIn, true, 'Browser B sees Operator 01 LOGGED IN');
    assert.strictEqual(p2Lobby.json.teammateReady, false, 'Browser B sees Operator 01 NOT READY');
    assert.strictEqual(p2Lobby.json.players[0].online, true, 'Browser B: Player 1 online');
    assert.strictEqual(p2Lobby.json.players[1].online, true, 'Browser B: Player 2 online');
    console.log('  ✓ PASS: Both browsers now recognize that BOTH Operator 01 and Operator 02 are LOGGED IN');

    console.log('\n--- 3. READINESS CONFIRMATION FLOW ---');
    // Premature start attempt before anyone confirms readiness must fail
    const prematureStart = await request('POST', '/api/player/event/start', { cookie: p1Cookie });
    console.log('prematureStart response:', prematureStart.status, prematureStart.body);
    assert(prematureStart.status >= 400, 'Premature start rejected with 4xx or 5xx');
    console.log('  ✓ PASS: Premature start correctly rejected when teammate is not ready');

    // Browser A confirms readiness
    console.log('Browser A (Operator 01) clicks [CONFIRM READINESS]...');
    const p1ReadyRes = await request('POST', '/api/player/ready', {
      cookie: p1Cookie,
      body: { ready: true }
    });
    assert.strictEqual(p1ReadyRes.status, 200, 'Player 1 ready returns 200');
    assert.strictEqual(p1ReadyRes.json.isReady, true, 'Player 1 response: isReady = true');
    assert.strictEqual(p1ReadyRes.json.teammateReady, false, 'Player 1 response: teammateReady = false');

    // Check Browser B lobby state (Player 2 must immediately see Player 1 as READY)
    const p2LobbyAfterP1Ready = await request('GET', '/api/player/lobby', { cookie: p2Cookie });
    assert.strictEqual(p2LobbyAfterP1Ready.json.isReady, false, 'Player 2 self is NOT READY');
    assert.strictEqual(p2LobbyAfterP1Ready.json.teammateReady, true, 'Player 2 sees Player 1 (teammate) as READY');
    assert.strictEqual(p2LobbyAfterP1Ready.json.players[0].ready, true, 'Players list: Player 1 ready = true');
    assert.strictEqual(p2LobbyAfterP1Ready.json.players[1].ready, false, 'Players list: Player 2 ready = false');
    console.log('  ✓ PASS: Player 2 immediately sees Operator 01 as READY and Operator 02 as NOT READY');

    // Browser B confirms readiness
    console.log('Browser B (Operator 02) clicks [CONFIRM READINESS]...');
    const p2ReadyRes = await request('POST', '/api/player/ready', {
      cookie: p2Cookie,
      body: { ready: true }
    });
    assert.strictEqual(p2ReadyRes.status, 200, 'Player 2 ready returns 200');
    assert.strictEqual(p2ReadyRes.json.isReady, true, 'Player 2 response: isReady = true');
    assert.strictEqual(p2ReadyRes.json.teammateReady, true, 'Player 2 response: teammateReady = true (both ready!)');

    // Both browsers verify mutual readiness
    const p1LobbyBothReady = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    assert.strictEqual(p1LobbyBothReady.json.isReady, true, 'Browser A: self ready = true');
    assert.strictEqual(p1LobbyBothReady.json.teammateReady, true, 'Browser A: teammate ready = true');
    assert.strictEqual(p1LobbyBothReady.json.players[0].ready, true, 'Browser A: Operator 01 ready');
    assert.strictEqual(p1LobbyBothReady.json.players[1].ready, true, 'Browser A: Operator 02 ready');

    const p2LobbyBothReady = await request('GET', '/api/player/lobby', { cookie: p2Cookie });
    assert.strictEqual(p2LobbyBothReady.json.isReady, true, 'Browser B: self ready = true');
    assert.strictEqual(p2LobbyBothReady.json.teammateReady, true, 'Browser B: teammate ready = true');
    assert.strictEqual(p2LobbyBothReady.json.players[0].ready, true, 'Browser B: Operator 01 ready');
    assert.strictEqual(p2LobbyBothReady.json.players[1].ready, true, 'Browser B: Operator 02 ready');
    console.log('  ✓ PASS: Both browsers now see both Operator 01 and Operator 02 as READY');

    console.log('\n--- 4. REFRESH & RECONNECT PERSISTENCE ---');
    // Refresh Browser A: re-call /me and /lobby
    const p1Refresh = await request('GET', '/api/player/me', { cookie: p1Cookie });
    assert.strictEqual(p1Refresh.status, 200, 'Player 1 /me returns 200 on refresh');
    assert.strictEqual(p1Refresh.json.isReady, true, 'Player 1 readiness persisted across refresh');
    assert.strictEqual(p1Refresh.json.teammateReady, true, 'Teammate readiness persisted across refresh');
    assert.strictEqual(p1Refresh.json.teammateLoggedIn, true, 'Teammate presence persisted across refresh');
    console.log('  ✓ PASS: Browser refresh correctly restores presence and readiness state');

    console.log('\n--- 5. SECURITY & IMPERSONATION CHECKS ---');
    // Player 1 attempts to mark Player 2 ready via request body spoofing
    await request('POST', '/api/player/ready', {
      cookie: p1Cookie,
      body: { playerId: 9999, playerNumber: 2, ready: false } // trying to turn off player 2
    });
    // Verify Player 2's readiness was untouched!
    const p2Check = await request('GET', '/api/player/lobby', { cookie: p2Cookie });
    assert.strictEqual(p2Check.json.isReady, true, 'Player 2 readiness was NOT modified by Player 1 spoofed request');
    console.log('  ✓ PASS: Server validates authenticated player; cannot modify partner readiness');

    // Login to Team Beta
    const betaLogin = await request('POST', '/api/player/login', {
      body: { teamCode: teamBetaCode, playerNumber: 1 }
    });
    const betaCookie = betaLogin.cookie;
    const betaLobby = await request('GET', '/api/player/lobby', { cookie: betaCookie });
    assert.strictEqual(betaLobby.json.teamCode, teamBetaCode, 'Beta player only sees Team Beta lobby');
    assert.notStrictEqual(betaLobby.json.teamCode, teamAlphaCode, 'Team Beta cannot see Team Alpha');
    console.log('  ✓ PASS: Team isolation preserved; players only see their own team');

    console.log('\n--- 6. START EVENT FLOW (Authorized when both ready) ---');
    const startRes = await request('POST', '/api/player/event/start', { cookie: p1Cookie });
    assert.strictEqual(startRes.status, 200, 'Event start returns 200');
    assert.strictEqual(startRes.json.gameState, 'IN_PROGRESS', 'Game state transitioned to IN_PROGRESS');

    // Browser B detects transition
    const p2GameCheck = await request('GET', '/api/player/lobby', { cookie: p2Cookie });
    assert.strictEqual(p2GameCheck.json.gameState, 'IN_PROGRESS', 'Browser B detects IN_PROGRESS state');
    console.log('  ✓ PASS: Game successfully starts when both operators are verified present and ready');

    console.log('\n--- 7. LOGOUT PRESENCE CLEANUP ---');
    // Player 2 logs out
    await request('POST', '/api/player/logout', { cookie: p2Cookie });
    // Player 1 checks lobby
    const p1AfterLogout = await request('GET', '/api/player/lobby', { cookie: p1Cookie });
    assert.strictEqual(p1AfterLogout.json.teammateLoggedIn, false, 'Player 1 correctly sees Operator 02 as NOT LOGGED IN after logout');
    assert.strictEqual(p1AfterLogout.json.players[1].online, false, 'Players array reflects partner offline');
    console.log('  ✓ PASS: Logout immediately updates partner presence to offline');

    console.log('\n====================================================');
    console.log('ALL LOBBY PRESENCE & READINESS TESTS PASSED (100%)');
    console.log('====================================================');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

server.listen(0, () => {
  PORT = server.address().port;
  runLobbyPresenceSuite();
});
