const db = require('../config/db');

async function inspect() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('--- DATABASE TABLES AND ROW COUNTS ---');
    for (const r of res.rows) {
      try {
        const c = await db.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
        console.log(`${r.table_name}: ${c.rows[0].count} rows`);
      } catch (err) {
        console.log(`${r.table_name}: error ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await db.pool.end();
  }
}

inspect();
