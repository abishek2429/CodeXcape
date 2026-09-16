const db = require('../config/db');

class TeamRepository {
  async findById(id, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT t.*, 
              e.id AS event_id, e.name AS event_name, e.status AS event_status, e.passkey_hash AS event_passkey_hash, e.start_time AS event_start_time
       FROM teams t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findForUpdateById(id, client) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT t.*, 
              e.id AS event_id, e.name AS event_name, e.status AS event_status, e.passkey_hash AS event_passkey_hash, e.start_time AS event_start_time
       FROM teams t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1 FOR UPDATE`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByTeamCode(teamCode) {
    const res = await db.query(
      `SELECT t.*, 
              e.id AS event_id, e.name AS event_name, e.status AS event_status, e.passkey_hash AS event_passkey_hash, e.start_time AS event_start_time
       FROM teams t
       JOIN events e ON t.event_id = e.id
       WHERE UPPER(t.team_code) = UPPER($1)
       ORDER BY e.created_at DESC`,
      [teamCode]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByEventIdAndTeamCode(eventId, teamCode) {
    const res = await db.query(
      `SELECT t.*, 
              e.id AS event_id, e.name AS event_name, e.status AS event_status, e.passkey_hash AS event_passkey_hash, e.start_time AS event_start_time
       FROM teams t
       JOIN events e ON t.event_id = e.id
       WHERE t.event_id = $1 AND UPPER(t.team_code) = UPPER($2)`,
      [eventId, teamCode]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByEventId(eventId) {
    const res = await db.query(
      `SELECT t.*, 
              e.id AS event_id, e.name AS event_name, e.status AS event_status, e.passkey_hash AS event_passkey_hash, e.start_time AS event_start_time
       FROM teams t
       LEFT JOIN events e ON t.event_id = e.id
       WHERE t.event_id = $1 ORDER BY t.id ASC`,
      [eventId]
    );
    return res.rows.map(r => this._mapRow(r));
  }

  async countByEventId(eventId) {
    const res = await db.query(`SELECT COUNT(*) as count FROM teams WHERE event_id = $1`, [eventId]);
    return parseInt(res.rows[0].count, 10);
  }

  async createTeam(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO teams (
         event_id, team_code, team_name, status, game_state,
         base_score, wrong_attempt_penalty, hint_penalty, anti_cheat_penalty, final_score,
         completed_mini_games, completed_levels, is_flagged_for_review, security_incident_count,
         total_story_pause_seconds, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         0, 0, 0, 0, 0,
         0, 0, false, 0,
         0, NOW(), NOW()
       ) RETURNING *`,
      [
        data.eventId,
        data.teamCode,
        data.teamName || data.teamCode,
        data.status || 'REGISTERED',
        data.gameState || 'NOT_STARTED'
      ]
    );
    return res.rows[0];
  }

  async save(team, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE teams SET
         status = $2,
         game_state = $3,
         started_at = $4,
         completed_at = $5,
         base_score = $6,
         wrong_attempt_penalty = $7,
         hint_penalty = $8,
         anti_cheat_penalty = $9,
         final_score = $10,
         completed_mini_games = $11,
         completed_levels = $12,
         is_flagged_for_review = $13,
         security_incident_count = $14,
         current_story_key = $15,
         story_paused_at = $16,
         total_story_pause_seconds = $17,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        team.id,
        team.status,
        team.gameState,
        team.startedAt,
        team.completedAt,
        team.baseScore ?? 0,
        team.wrongAttemptPenalty ?? 0,
        team.hintPenalty ?? 0,
        team.antiCheatPenalty ?? 0,
        team.finalScore ?? 0,
        team.completedMiniGames ?? 0,
        team.completedLevels ?? 0,
        team.isFlaggedForReview ?? false,
        team.securityIncidentCount ?? 0,
        team.currentStoryKey,
        team.storyPausedAt,
        team.totalStoryPauseSeconds ?? 0
      ]
    );
    return this._mapRow(res.rows[0]);
  }

  async deleteById(id) {
    await db.query(`DELETE FROM teams WHERE id = $1`, [id]);
  }

  async resetTeamStateById(teamId, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE teams SET
         status = 'REGISTERED',
         game_state = 'NOT_STARTED',
         started_at = NULL,
         completed_at = NULL,
         base_score = 0,
         wrong_attempt_penalty = 0,
         hint_penalty = 0,
         anti_cheat_penalty = 0,
         final_score = 0,
         completed_mini_games = 0,
         completed_levels = 0,
         is_flagged_for_review = false,
         security_incident_count = 0,
         current_story_key = NULL,
         story_paused_at = NULL,
         total_story_pause_seconds = 0,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [teamId]
    );
    return res.rows[0] ? this._mapRow(res.rows[0]) : null;
  }

  async resetAllTeamStates(client = null) {
    const executor = client || db;
    await executor.query(
      `UPDATE teams SET
         status = 'REGISTERED',
         game_state = 'NOT_STARTED',
         started_at = NULL,
         completed_at = NULL,
         base_score = 0,
         wrong_attempt_penalty = 0,
         hint_penalty = 0,
         anti_cheat_penalty = 0,
         final_score = 0,
         completed_mini_games = 0,
         completed_levels = 0,
         is_flagged_for_review = false,
         security_incident_count = 0,
         current_story_key = NULL,
         story_paused_at = NULL,
         total_story_pause_seconds = 0,
         updated_at = NOW()`
    );
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: parseInt(row.id, 10),
      eventId: row.event_id ? parseInt(row.event_id, 10) : null,
      teamCode: row.team_code,
      teamName: row.team_name,
      status: row.status,
      gameState: row.game_state,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      baseScore: parseInt(row.base_score || 0, 10),
      wrongAttemptPenalty: parseInt(row.wrong_attempt_penalty || 0, 10),
      hintPenalty: parseInt(row.hint_penalty || 0, 10),
      antiCheatPenalty: parseInt(row.anti_cheat_penalty || 0, 10),
      finalScore: parseInt(row.final_score || 0, 10),
      completedMiniGames: parseInt(row.completed_mini_games || 0, 10),
      completedLevels: parseInt(row.completed_levels || 0, 10),
      isFlaggedForReview: Boolean(row.is_flagged_for_review),
      securityIncidentCount: parseInt(row.security_incident_count || 0, 10),
      currentStoryKey: row.current_story_key,
      storyPausedAt: row.story_paused_at,
      totalStoryPauseSeconds: parseInt(row.total_story_pause_seconds || 0, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      event: row.event_id ? {
        id: parseInt(row.event_id, 10),
        name: row.event_name,
        status: row.event_status,
        passkeyHash: row.event_passkey_hash,
        startTime: row.event_start_time
      } : null
    };
  }
}

module.exports = new TeamRepository();
