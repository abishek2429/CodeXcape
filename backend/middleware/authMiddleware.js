const gameSessionRepository = require('../repositories/gameSessionRepository');
const adminSessionRepository = require('../repositories/adminSessionRepository');
const env = require('../config/env');

function extractPlayerToken(req) {
  const h1 = req.headers['x-player-session'];
  if (h1 && h1.trim()) return h1.trim();

  const h2 = req.headers['x-session-token'];
  if (h2 && h2.trim()) return h2.trim();

  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7).trim();
  }

  if (req.cookies && req.cookies['PLAYER_SESSION']) {
    return req.cookies['PLAYER_SESSION'].trim();
  }

  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/PLAYER_SESSION=([^;]+)/);
    if (match) return match[1].trim();
  }

  return null;
}

function extractAdminToken(req) {
  const h1 = req.headers['x-admin-session'];
  if (h1 && h1.trim()) return h1.trim();

  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7).trim();
  }

  if (req.cookies && req.cookies['ADMIN_SESSION']) {
    return req.cookies['ADMIN_SESSION'].trim();
  }

  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/ADMIN_SESSION=([^;]+)/);
    if (match) return match[1].trim();
  }

  return null;
}

async function authenticatePlayer(req, res, next) {
  const token = extractPlayerToken(req);

  if (!token) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      code: 'UNAUTHENTICATED',
      message: 'Authentication required to access player endpoints.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const session = await gameSessionRepository.findBySessionTokenWithDetails(token);

    if (!session) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        code: 'INVALID_SESSION',
        message: 'Invalid authentication session.',
        timestamp: new Date().toISOString()
      });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        code: 'INVALID_SESSION',
        message: 'Session is inactive or terminated.',
        timestamp: new Date().toISOString()
      });
    }

    const timeoutMs = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    const lastActivity = new Date(session.lastActivityAt).getTime();
    if (Date.now() - lastActivity > timeoutMs) {
      await gameSessionRepository.updateStatus(session.id, 'EXPIRED', false);
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        code: 'SESSION_EXPIRED',
        message: 'Session has expired. Please log in again.',
        timestamp: new Date().toISOString()
      });
    }

    if (!session.player.isActive) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        code: 'ACCOUNT_DISABLED',
        message: 'Player account is deactivated or ineligible.',
        timestamp: new Date().toISOString()
      });
    }

    // Touch last activity asynchronously
    gameSessionRepository.touchLastActivity(session.id).catch(() => {});

    req.playerPrincipal = {
      playerId: session.player.id,
      teamId: session.team.id,
      eventId: session.team.event.id,
      playerNumber: session.player.playerNumber,
      teamCode: session.team.teamCode,
      teamName: session.team.teamName,
      displayName: session.player.displayName,
      sessionToken: session.sessionToken,
      isActive: session.player.isActive
    };

    req.player = req.playerPrincipal;
    req.currentSession = session;
    next();
  } catch (err) {
    next(err);
  }
}

async function authenticateAdmin(req, res, next) {
  const adminToken = extractAdminToken(req);

  if (adminToken) {
    try {
      const session = await adminSessionRepository.findBySessionToken(adminToken);
      if (session && session.status === 'ACTIVE') {
        adminSessionRepository.touchLastActivity(session.id).catch(() => {});
        req.adminPrincipal = {
          username: 'admin',
          role: 'ADMIN'
        };
        req.admin = req.adminPrincipal;
        return next();
      }
    } catch (err) {
      return next(err);
    }
  }

  // Check if player token is provided on admin route -> 403 Forbidden
  const playerToken = extractPlayerToken(req);
  if (playerToken) {
    return res.status(403).json({
      status: 403,
      error: 'Forbidden',
      code: 'FORBIDDEN',
      message: 'Access denied: Admin privileges required.',
      timestamp: new Date().toISOString()
    });
  }

  return res.status(401).json({
    status: 401,
    error: 'Unauthorized',
    code: 'UNAUTHORIZED',
    message: 'Admin authentication required.',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  authenticatePlayer,
  authenticateAdmin,
  extractPlayerToken,
  extractAdminToken
};
