const db = require('../config/db');

class QuestionRepository {
  async findByLevelIdAndStageNumberAndPlayerNumber(levelId, stageNumber, playerNumber, client = null) {
    const role = (playerNumber === 1 || playerNumber === 'PLAYER_1') ? 'PLAYER_1' : 'PLAYER_2';
    const executor = client || db;
    const res = await executor.query(
      `SELECT * FROM questions 
       WHERE level_id = $1 AND stage_number = $2 AND player_number = $3 AND is_active = true`,
      [levelId, stageNumber, role]
    );
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async findByLevelId(levelId) {
    const res = await db.query(
      `SELECT * FROM questions WHERE level_id = $1 AND is_active = true ORDER BY stage_number ASC, player_number ASC`,
      [levelId]
    );
    return res.rows.map(this._mapRow);
  }

  async findById(id) {
    const res = await db.query(`SELECT * FROM questions WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this._mapRow(res.rows[0]);
  }

  async saveQuestionConfig(data) {
    const role = (data.playerNumber === 1 || data.playerNumber === 'PLAYER_1') ? 'PLAYER_1' : 'PLAYER_2';
    const existing = await this.findByLevelIdAndStageNumberAndPlayerNumber(data.levelId, data.stageNumber, role);

    if (existing) {
      const res = await db.query(
        `UPDATE questions SET
           evidence = COALESCE($2, evidence),
           expected_answer_hash = COALESCE($3, expected_answer_hash),
           answer_type = COALESCE($4, answer_type),
           puzzle_context = COALESCE($5, puzzle_context),
           instructions = COALESCE($6, instructions),
           puzzle_metadata = COALESCE($7, puzzle_metadata),
           validation_rules = COALESCE($8, validation_rules),
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          existing.id,
          data.evidence,
          data.expectedAnswer || data.expectedAnswerHash,
          data.answerType,
          data.puzzleContext,
          data.instructions,
          data.puzzleMetadata,
          data.validationRules
        ]
      );
      return this._mapRow(res.rows[0]);
    } else {
      const res = await db.query(
        `INSERT INTO questions (
           level_id, stage_number, player_number, evidence, expected_answer_hash, answer_type,
           puzzle_context, instructions, puzzle_metadata, validation_rules, is_active, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW()
         ) RETURNING *`,
        [
          data.levelId,
          data.stageNumber,
          role,
          data.evidence || '',
          data.expectedAnswer || data.expectedAnswerHash || '',
          data.answerType || 'TEXT',
          data.puzzleContext || '',
          data.instructions || '',
          data.puzzleMetadata || '',
          data.validationRules || ''
        ]
      );
      return this._mapRow(res.rows[0]);
    }
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      levelId: parseInt(r.level_id, 10),
      stageNumber: parseInt(r.stage_number, 10),
      playerNumber: r.player_number,
      evidence: r.evidence,
      expectedAnswerHash: r.expected_answer_hash,
      answerType: r.answer_type,
      puzzleContext: r.puzzle_context,
      instructions: r.instructions,
      puzzleMetadata: r.puzzle_metadata,
      validationRules: r.validation_rules,
      difficulty: r.difficulty,
      technicalCategory: r.technical_category,
      isActive: r.is_active !== false,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new QuestionRepository();
