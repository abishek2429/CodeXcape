const BACKEND_URL = 'https://codexcape-backend.vercel.app';

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

async function syncProduction() {
  console.log('=== SYNCING PRODUCTION TEAMS ON CODEXCAPE-BACKEND.VERCEL.APP ===\n');

  // 1. Admin Login
  const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' })
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  const cookie = loginRes.headers.get('set-cookie') || '';
  console.log('✓ Admin authenticated successfully.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Admin-Session': token,
    'Cookie': cookie
  };

  // 2. Fetch existing teams
  const listRes = await fetch(`${BACKEND_URL}/api/admin/events/1/teams`, { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list teams: ${listRes.status} ${await listRes.text()}`);
  }
  const currentTeams = await listRes.json();
  console.log(`Current teams on production: ${currentTeams.length}`);

  // 3. Delete non-official teams
  for (const team of currentTeams) {
    if (!OFFICIAL_TEAMS.includes(team.teamCode)) {
      console.log(`Deleting unauthorized team: ${team.teamCode} (ID: ${team.id})...`);
      const delRes = await fetch(`${BACKEND_URL}/api/admin/teams/${team.id}`, {
        method: 'DELETE',
        headers
      });
      if (delRes.ok || delRes.status === 204) {
        console.log(`  ✓ Deleted ${team.teamCode}`);
      } else {
        console.error(`  ✗ Failed to delete ${team.teamCode}: ${delRes.status} ${await delRes.text()}`);
      }
    }
  }

  // 4. Create missing official teams
  const remainingRes = await fetch(`${BACKEND_URL}/api/admin/events/1/teams`, { headers });
  const remainingTeams = await remainingRes.json();
  const remainingCodes = remainingTeams.map(t => t.teamCode);

  for (const code of OFFICIAL_TEAMS) {
    if (!remainingCodes.includes(code)) {
      console.log(`Creating missing official team: ${code}...`);
      const createRes = await fetch(`${BACKEND_URL}/api/admin/events/1/teams`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customTeamCode: code,
          teamName: code,
          player1DisplayName: 'Player 1',
          player2DisplayName: 'Player 2'
        })
      });
      if (createRes.ok || createRes.status === 201) {
        console.log(`  ✓ Created ${code}`);
      } else {
        console.error(`  ✗ Failed to create ${code}: ${createRes.status} ${await createRes.text()}`);
      }
    } else {
      console.log(`Official team ${code} already present.`);
    }
  }

  // 5. Update Passkey to 382439 on production
  console.log('\nUpdating event passkey to 382439 on production...');
  const passkeyRes = await fetch(`${BACKEND_URL}/api/admin/events/1/passkey`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ passkey: '382439' })
  });
  console.log(`Passkey update status: ${passkeyRes.status}`, await passkeyRes.text());

  // 6. Reset all sessions and verify
  console.log('\nResetting all sessions to ensure clean state...');
  await fetch(`${BACKEND_URL}/api/admin/sessions/reset-all`, { method: 'POST', headers });

  // 7. Verify final teams list
  const finalListRes = await fetch(`${BACKEND_URL}/api/admin/events/1/teams`, { headers });
  const finalTeams = await finalListRes.json();
  console.log(`\n====================================================`);
  console.log(`FINAL PRODUCTION TEAMS COUNT: ${finalTeams.length}`);
  console.log(`====================================================`);
  finalTeams.forEach((t, i) => {
    console.log(`${String(i + 1).padStart(2, ' ')}. [ID ${t.id}] ${t.teamCode} (${t.teamName})`);
  });
}

syncProduction().catch(err => {
  console.error('FATAL SYNC ERROR:', err);
  process.exit(1);
});
