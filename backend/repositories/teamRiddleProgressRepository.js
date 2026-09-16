const db = require('../config/db');

class TeamRiddleProgressRepository {
  async findByTeamIdOrderByRiddleIndexAsc(teamId) {
    const res = await db.query(
      `SELECT * FROM team_riddle_progress WHERE team_id = $1 ORDER BY riddle_index ASC`,
      [teamId]
    );
    return res.rows.map(this._mapRow);
  }

  async findByTeamIdAndRiddleIndex(teamId, riddleIndex) {
    const res = await db.query(
      `SELECT * FROM team_riddle_progress WHERE team_id = $1 AND riddle_index = $2`,
      [teamId, riddleIndex]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async save(progress) {
    if (progress.id) {
      const res = await db.query(
        `UPDATE team_riddle_progress SET
           is_solved = $2,
           solved_digit = $3,
           solved_at = $4,
           solved_by_player_id = $5,
           wrong_attempts = $6,
           last_attempt_at = $7,
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          progress.id,
          Boolean(progress.isSolved),
          progress.solvedDigit || null,
          progress.solvedAt || null,
          progress.solvedByPlayerId || null,
          progress.wrongAttempts || 0,
          progress.lastAttemptAt || null
        ]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await db.query(
        `INSERT INTO team_riddle_progress (
           team_id, riddle_index, is_solved, solved_digit, solved_at, solved_by_player_id, wrong_attempts, last_attempt_at, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
         ) RETURNING *`,
        [
          progress.teamId,
          progress.riddleIndex,
          Boolean(progress.isSolved),
          progress.solvedDigit || null,
          progress.solvedAt || null,
          progress.solvedByPlayerId || null,
          progress.wrongAttempts || 0,
          progress.lastAttemptAt || null
        ]
      );
      return this._mapRow(res.rows[0]);
    }
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      riddleIndex: parseInt(r.riddle_index, 10),
      isSolved: Boolean(r.is_solved),
      solvedDigit: r.solved_digit,
      solvedAt: r.solved_at,
      solvedByPlayerId: r.solved_by_player_id ? parseInt(r.solved_by_player_id, 10) : null,
      wrongAttempts: parseInt(r.wrong_attempts || 0, 10),
      lastAttemptAt: r.last_attempt_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new TeamRiddleProgressRepository();
