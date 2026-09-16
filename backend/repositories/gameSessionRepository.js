const db = require('../config/db');

class GameSessionRepository {
  async findBySessionTokenWithDetails(token) {
    const query = `
      SELECT 
        gs.*,
        p.id AS player_id,
        p.player_number,
        p.display_name,
        p.status AS player_status,
        p.is_active AS player_is_active,
        t.id AS team_id,
        t.team_code,
        t.team_name,
        t.status AS team_status,
        t.game_state AS team_game_state,
        e.id AS event_id,
        e.name AS event_name,
        e.status AS event_status,
        e.passkey_hash AS event_passkey_hash
      FROM game_sessions gs
      JOIN players p ON gs.player_id = p.id
      JOIN teams t ON gs.team_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE gs.session_token = $1
    `;
    const res = await db.query(query, [token]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      sessionToken: row.session_token,
      status: row.status,
      isConnected: row.is_connected,
      createdAt: row.created_at,
      lastActivityAt: row.last_activity_at,
      disconnectedAt: row.disconnected_at,
      player: {
        id: row.player_id,
        playerNumber: row.player_number,
        displayName: row.display_name,
        status: row.player_status,
        isActive: row.player_is_active !== false
      },
      team: {
        id: row.team_id,
        teamCode: row.team_code,
        teamName: row.team_name,
        status: row.team_status,
        gameState: row.team_game_state,
        event: {
          id: row.event_id,
          name: row.event_name,
          status: row.event_status,
          passkeyHash: row.event_passkey_hash
        }
      }
    };
  }

  async findAllByPlayerIdAndStatus(playerId, status) {
    const res = await db.query(
      `SELECT * FROM game_sessions WHERE player_id = $1 AND status = $2`,
      [playerId, status]
    );
    return res.rows;
  }

  async findByPlayerIdInAndStatus(playerIds, status) {
    if (!playerIds || playerIds.length === 0) return [];
    const res = await db.query(
      `SELECT * FROM game_sessions WHERE player_id = ANY($1::bigint[]) AND status = $2 ORDER BY id DESC`,
      [playerIds, status]
    );
    return res.rows.map(r => ({
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      playerId: parseInt(r.player_id, 10),
      sessionToken: r.session_token,
      status: r.status,
      isConnected: r.is_connected,
      createdAt: r.created_at,
      lastActivityAt: r.last_activity_at,
      disconnectedAt: r.disconnected_at
    }));
  }

  async createSession(teamId, playerId, sessionToken, client = null) {
    const q = `
      INSERT INTO game_sessions (team_id, player_id, session_token, status, is_connected, created_at, last_activity_at)
      VALUES ($1, $2, $3, 'ACTIVE', true, NOW(), NOW())
      RETURNING *
    `;
    const executor = client || db;
    const res = await executor.query(q, [teamId, playerId, sessionToken]);
    return res.rows[0];
  }

  async updateStatus(id, status, isConnected = false) {
    await db.query(
      `UPDATE game_sessions 
       SET status = $2, is_connected = $3, disconnected_at = CASE WHEN $3 = false THEN NOW() ELSE disconnected_at END
       WHERE id = $1`,
      [id, status, isConnected]
    );
  }

  async touchLastActivity(id) {
    await db.query(
      `UPDATE game_sessions SET last_activity_at = NOW(), is_connected = true WHERE id = $1`,
      [id]
    );
  }

  async terminateByPlayerId(playerId) {
    await db.query(
      `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
       WHERE player_id = $1 AND status = 'ACTIVE'`,
      [playerId]
    );
  }

  async terminateByTeamId(teamId) {
    await db.query(
      `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
       WHERE team_id = $1 AND status = 'ACTIVE'`,
      [teamId]
    );
  }

  async terminateById(sessionId) {
    await db.query(
      `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }

  async terminateAll() {
    await db.query(
      `UPDATE game_sessions SET status = 'TERMINATED', is_connected = false, disconnected_at = NOW()
       WHERE status = 'ACTIVE'`
    );
  }
}

module.exports = new GameSessionRepository();
