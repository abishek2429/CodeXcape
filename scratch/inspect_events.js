const db = require('../backend/config/db');

async function check() {
  try {
    const res = await db.query("SELECT * FROM events WHERE name LIKE '%LOAD_TEST%' OR id >= 1000 ORDER BY id DESC LIMIT 20");
    console.log('Events:');
    res.rows.forEach(r => console.log(`  id=${r.id}, name="${r.name}", status=${r.status}`));

    const teams = await db.query("SELECT id, event_id, team_name, team_code FROM teams WHERE team_name LIKE '%LOAD%' ORDER BY id DESC LIMIT 30");
    console.log(`Load teams (${teams.rows.length}):`);
    teams.rows.forEach(t => console.log(`  id=${t.id}, event_id=${t.event_id}, name="${t.team_name}", code=${t.team_code}`));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
