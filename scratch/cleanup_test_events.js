async function cleanup() {
  const BACKEND_URL = 'https://codexcape-backend.vercel.app';
  const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const teamsRes = await fetch(`${BACKEND_URL}/api/admin/events/1008/teams`, {
    headers: { 'Cookie': cookie }
  });
  const teams = await teamsRes.json();
  console.log(`Event 1008 has ${teams.length} teams.`);
  for (const t of teams) {
    console.log(`  Team: ${t.id} - ${t.teamName} (${t.teamCode})`);
  }
}

cleanup();
