const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const db = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const webSocketPublisher = require('./services/webSocketService');
const healthController = require('./controllers/healthController');

const app = express();

// CORS configuration
const allowedOrigins = Array.isArray(env.CORS_ALLOWED_ORIGINS)
  ? env.CORS_ALLOWED_ORIGINS
  : String(env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(null, true); // Permissive in dev/local
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Player-Session', 'X-Admin-Session', 'Cookie']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check on root
app.get('/', (req, res, next) => healthController.getHealth(req, res, next));
app.get('/api/health', (req, res, next) => healthController.getHealth(req, res, next));

// Mount main routes under /api
app.use('/api', routes);

// Global centralized error handler
app.use(errorHandler);

// HTTP and WebSocket server initialization
const server = http.createServer(app);
webSocketPublisher.initialize(server);

const PORT = env.PORT || 8080;

const initSchema = require('./config/initSchema');

if (require.main === module) {
  (async () => {
    try {
      await initSchema();
    } catch (err) {
      console.warn('initSchema notice:', err.message);
    }
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`CodeXcape Node.js Server listening on port ${PORT}`);
      console.log(`HTTP API: http://localhost:${PORT}/api`);
      console.log(`WebSocket STOMP: ws://localhost:${PORT}/ws`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  })();
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP and WS servers');
  server.close(() => {
    db.pool.end();
    console.log('HTTP and database connection pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP and WS servers');
  server.close(() => {
    db.pool.end();
    console.log('HTTP and database connection pool closed');
    process.exit(0);
  });
});

module.exports = { app, server };
