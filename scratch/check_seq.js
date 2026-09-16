const db = require('../backend/config/db');

async function check() {
  try {
    const s1 = await db.query('SELECT last_value FROM events_id_seq');
    console.log('events_id_seq last_value:', s1.rows[0].last_value);
    const s2 = await db.query('SELECT MAX(id) as max_id FROM events');
    console.log('MAX(id) in events:', s2.rows[0].max_id);
    const s3 = await db.query('SELECT MAX(id) as max_id FROM teams');
    console.log('MAX(id) in teams:', s3.rows[0].max_id);
    const s4 = await db.query('SELECT last_value FROM teams_id_seq');
    console.log('teams_id_seq last_value:', s4.rows[0].last_value);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
