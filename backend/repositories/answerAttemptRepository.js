const db = require('../config/db');

class AnswerAttemptRepository {
  async countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(teamId, playerId, levelId, questionId) {
    const res = await db.query(
      `SELECT COUNT(*) FROM answer_attempts
       WHERE team_id = $1 AND player_id = $2 AND level_id = $3 AND question_id = $4`,
      [teamId, playerId, levelId, questionId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(teamId, playerId, levelId, questionId) {
    const res = await db.query(
      `SELECT 1 FROM answer_attempts
       WHERE team_id = $1 AND player_id = $2 AND level_id = $3 AND question_id = $4 AND is_correct = true
       LIMIT 1`,
      [teamId, playerId, levelId, questionId]
    );
    return res.rows.length > 0;
  }

  async recordAttempt(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO answer_attempts (
         team_id, player_id, level_id, question_id, attempt_number,
         submitted_answer, interaction_payload, is_correct, submitted_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, NOW()
       ) RETURNING *`,
      [
        data.teamId,
        data.playerId,
        data.levelId,
        data.questionId,
        data.attemptNumber || 1,
        data.submittedAnswer || '',
        data.interactionPayload || null,
        Boolean(data.isCorrect)
      ]
    );
    return res.rows[0];
  }

  async deleteByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM answer_attempts WHERE team_id = $1`, [teamId]);
  }

  async deleteAll(client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM answer_attempts`);
  }
}

module.exports = new AnswerAttemptRepository();
