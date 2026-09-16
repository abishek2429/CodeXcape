const { Pool, types } = require('pg');
const env = require('./env');

// Parse timestamp without time zone (OID 1114) as UTC, identical to Spring Boot / JDBC Instant mapping
types.setTypeParser(1114, str => str ? new Date(str.replace(' ', 'T') + 'Z') : null);

const connectionString = env.DATABASE_URL;
const isRemote = connectionString.includes('aws') || connectionString.includes('supabase') || connectionString.includes('render');

const poolConfig = {
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (isRemote) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a query with parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error:', {
      text,
      params,
      message: err.message
    });
    throw err;
  }
}

/**
 * Helper to run a function inside a database transaction
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
