/**
 * Rate Limiting Middleware replicating RateLimitingFilter.java
 */
const requestCounts = new Map();
const WINDOW_MS = 10000; // 10 seconds
const MAX_REQUESTS = 10;  // 10 requests per 10s

function isRateLimitedEndpoint(req) {
  if (req.method !== 'POST') return false;
  const path = req.path;
  return (
    path === '/api/player/login' ||
    path === '/api/admin/login' ||
    path === '/api/player/anti-cheat/event' ||
    path.startsWith('/api/player/game/hints') ||
    path === '/api/player/game/current/answer' ||
    path === '/api/player/game/final-passkey'
  );
}

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

function isLocalhost(key) {
  return key === '127.0.0.1' || key === '::1' || key === '::ffff:127.0.0.1' || key === 'localhost';
}

function rateLimitMiddleware(req, res, next) {
  if (!isRateLimitedEndpoint(req)) {
    return next();
  }

  const clientKey = getClientKey(req);

  // Allow high-throughput localhost integration tests
  if (isLocalhost(clientKey) && !req.headers['x-forwarded-for']) {
    return next();
  }

  const now = Date.now();
  let timestamps = requestCounts.get(clientKey) || [];

  // Filter out timestamps outside window
  timestamps = timestamps.filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Rate limit exceeded. Please wait before retrying.',
      timestamp: new Date().toISOString()
    });
  }

  timestamps.push(now);
  requestCounts.set(clientKey, timestamps);
  next();
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestCounts.entries()) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, valid);
    }
  }
}, 60000);

rateLimitMiddleware.slidingWindowRateLimiter = rateLimitMiddleware;
rateLimitMiddleware.rateLimitMiddleware = rateLimitMiddleware;

module.exports = rateLimitMiddleware;
