const path = require('path');
const dotenv = require('dotenv');

// Load .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function normalizeDbUrl(url) {
  if (!url) return 'postgresql://postgres:postgres@localhost:5432/technical_escape_room';
  // If JDBC prefix is present (e.g. jdbc:postgresql://...), strip 'jdbc:'
  if (url.startsWith('jdbc:')) {
    url = url.substring(5);
  }
  return url;
}

const rawDbUrl = process.env.DATABASE_URL || process.env.SPRING_DATASOURCE_URL;
const rawDbUser = process.env.PGUSER || process.env.SPRING_DATASOURCE_USERNAME || 'postgres';
const rawDbPass = process.env.PGPASSWORD || process.env.SPRING_DATASOURCE_PASSWORD || 'postgres';

const env = {
  PORT: parseInt(process.env.PORT || process.env.SERVER_PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: normalizeDbUrl(rawDbUrl),
  DB_USER: rawDbUser,
  DB_PASSWORD: rawDbPass,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  SESSION_TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60', 10),
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://code-xcape.vercel.app,https://*.vercel.app')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  ANTIOCHEAT_TAB_SWITCH_PENALTY: parseInt(process.env.TAB_SWITCH_PENALTY || '10', 10),
  ANTIOCHEAT_FULLSCREEN_EXIT_PENALTY: parseInt(process.env.FULLSCREEN_EXIT_PENALTY || '15', 10),
  ANTIOCHEAT_PROLONGED_HIDDEN_PENALTY: parseInt(process.env.PROLONGED_HIDDEN_PENALTY || '15', 10),
  ANTIOCHEAT_COOLDOWN_SECONDS: parseInt(process.env.COOLDOWN_SECONDS || '10', 10),
  ANTIOCHEAT_PROLONGED_THRESHOLD_SECONDS: parseInt(process.env.PROLONGED_THRESHOLD_SECONDS || '30', 10)
};

module.exports = env;
