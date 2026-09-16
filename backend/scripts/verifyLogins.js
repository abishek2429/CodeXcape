const db = require('../config/db');
const playerSessionService = require('../services/playerSessionService');

const OFFICIAL_TEAMS = [
  'TEAM-ALPHA',
  'TEAM-BETA',
  'TEAM-2NDPLACE',
  'TEAM-BDUCODERS',
  'TEAM-CTRL+ESC',
  'TEAM-CYBERTRONS',
  'TEAM-DOJISDOMAIN',
  'TEAM-DUOSEEKERS',
  'TEAM-GAC_WARRIORS',
  'TEAM-GAMMA',
  'TEAM-INEVITABLE',
  'TEAM-JAMALIANS',
  'TEAM-LAZYCODERS',
  'TEAM-NINETEEN',
  'TEAM-POWERHITTERS',
  'TEAM-PHOENIX',
  'TEAM-REZERO',
  'TEAM-UNKNOWN',
  'TEAM-CHAIFLOW',
  'TEAM-VARISHU'
];

const DELETED_TEAMS = [
  'CODEXCAPE-TEST',
  'TEAM-BRAVO',
  'TEAM-CHARLIE',
  'TEAM-DELTA',
  'TEAM-ECHO'
];

async function testAllLogins() {
  console.log('====================================================');
  console.log('VERIFYING AUTHENTICATION FOR OFFICIAL TEAMS & REJECTION OF PURGED TEAMS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  console.log('--- TESTING 20 OFFICIAL TEAMS (PLAYER 1 & PLAYER 2) ---');
  for (const teamCode of OFFICIAL_TEAMS) {
    try {
      // Mock Express response object for cookie setting
      const mockRes = {
        cookie: () => {},
        clearCookie: () => {}
      };
      const mockReq = { headers: {} };

      // Test Player 1 login
      const p1 = await playerSessionService.login({ teamCode, playerNumber: 1 }, mockReq, mockRes);
      if (p1.teamCode === teamCode && p1.playerNumber === 1 && p1.gameState === 'NOT_STARTED') {
        process.stdout.write(`  ✓ ${teamCode} (P1: OK, `);
      } else {
        throw new Error(`Unexpected P1 login response for ${teamCode}`);
      }

      // Test Player 2 login
      const p2 = await playerSessionService.login({ teamCode, playerNumber: 2 }, mockReq, mockRes);
      if (p2.teamCode === teamCode && p2.playerNumber === 2 && p2.gameState === 'NOT_STARTED') {
        console.log(`P2: OK)`);
        passed += 2;
      } else {
        throw new Error(`Unexpected P2 login response for ${teamCode}`);
      }
    } catch (err) {
      console.error(`  ❌ FAILED for ${teamCode}:`, err.message);
      failed++;
    }
  }

  console.log('\n--- TESTING DELETED / UNAUTHORIZED TEAMS (MUST BE REJECTED) ---');
  for (const teamCode of DELETED_TEAMS) {
    try {
      const mockRes = { cookie: () => {}, clearCookie: () => {} };
      const mockReq = { headers: {} };
      await playerSessionService.login({ teamCode, playerNumber: 1 }, mockReq, mockRes);
      console.error(`  ❌ SECURITY ERROR: Deleted team ${teamCode} was NOT rejected!`);
      failed++;
    } catch (err) {
      if (err.message.includes('Team not found')) {
        console.log(`  ✓ ${teamCode.padEnd(20, ' ')} -> REJECTED (Team not found)`);
        passed++;
      } else {
        console.error(`  ❌ Unexpected error for ${teamCode}:`, err.message);
        failed++;
      }
    }
  }

  console.log('\n====================================================');
  console.log(`AUTHENTICATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testAllLogins().catch(err => {
  console.error('Fatal error during auth verification:', err);
  process.exit(1);
});
