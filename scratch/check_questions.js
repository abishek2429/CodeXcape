const db = require('../backend/config/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT l.level_number, q.stage_number, q.player_number, q.expected_answer_hash, q.answer_type 
      FROM questions q 
      JOIN levels l ON q.level_id = l.id 
      ORDER BY l.level_number, q.stage_number, q.player_number
    `);
    console.log(`Found ${res.rows.length} questions:`);
    res.rows.forEach(r => {
      console.log(`  Lvl ${r.level_number} Stg ${r.stage_number} ${r.player_number}: [${r.expected_answer_hash}] (${r.answer_type})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
