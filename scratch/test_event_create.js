
async function testCreate() {
  const BACKEND_URL = 'https://codexcape-backend.vercel.app';
  const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login cookie:', cookie);

  const eventRes = await fetch(`${BACKEND_URL}/api/admin/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      name: `TEST_EVENT_${Date.now()}`,
      description: 'Test',
      passkey: '123456'
    })
  });
  const text = await eventRes.text();
  console.log('Event create status:', eventRes.status, 'body:', text);
  process.exit(0);
}

testCreate();
