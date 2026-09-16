async function testDelete() {
  const BACKEND_URL = 'https://codexcape-backend.vercel.app';
  const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const delRes = await fetch(`${BACKEND_URL}/api/admin/teams/64`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });
  console.log('Delete status:', delRes.status, 'body:', await delRes.text());
}

testDelete();
