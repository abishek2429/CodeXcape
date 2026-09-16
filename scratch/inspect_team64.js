async function inspectTeam64() {
  const BACKEND_URL = 'https://codexcape-backend.vercel.app';
  // Login as Player 1 of Team 64 (teamCode: TEAM-001)
  const loginRes = await fetch(`${BACKEND_URL}/api/player/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamCode: 'TEAM-001', playerNumber: 1, displayName: 'Op1_T01' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);

  // Check resync
  const resyncRes = await fetch(`${BACKEND_URL}/api/player/game/resync`, {
    headers: { 'Cookie': cookie }
  });
  const resync = await resyncRes.json();
  console.log('Resync state:', {
    gameState: resync.gameState,
    levelNumber: resync.levelNumber,
    currentStage: resync.currentStage,
    completedLevels: resync.completedLevels
  });

  // Check riddles
  const riddlesRes = await fetch(`${BACKEND_URL}/api/player/riddles`, {
    headers: { 'Cookie': cookie }
  });
  console.log('Riddles board:', await riddlesRes.json());
}

inspectTeam64();
