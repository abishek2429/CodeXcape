const eventRepository = require('../../repositories/eventRepository');
const levelRepository = require('../../repositories/levelRepository');
const questionRepository = require('../../repositories/questionRepository');
const hintRepository = require('../../repositories/hintRepository');
const adminAuditService = require('./adminAuditService');
const eventContentValidationService = require('./eventContentValidationService');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class AdminContentService {
  async saveQuestionConfig(principal, eventId, levelNumber, dto) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    this._validateContentEditable(event);

    const level = await levelRepository.findByLevelNumber(levelNumber);
    if (!level) {
      throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);
    }

    const stageNumber = dto.stageNumber || 1;
    const playerRole = (dto.playerNumber === 1 || dto.playerNumber === 'PLAYER_1') ? 'PLAYER_1' : 'PLAYER_2';

    const saved = await questionRepository.saveQuestionConfig({
      levelId: level.id,
      stageNumber,
      playerNumber: playerRole,
      evidence: (dto.evidence || '').trim(),
      instructions: dto.instructions ? dto.instructions.trim() : null,
      puzzleContext: dto.puzzleContext ? dto.puzzleContext.trim() : null,
      technicalCategory: dto.technicalCategory ? dto.technicalCategory.trim() : null,
      difficulty: dto.difficulty ? dto.difficulty.trim() : null,
      validationRules: dto.validationRules ? dto.validationRules.trim() : null,
      puzzleMetadata: dto.puzzleMetadata ? dto.puzzleMetadata.trim() : null,
      expectedAnswer: (dto.expectedAnswer || '').trim(),
      answerType: dto.answerType || 'TEXT'
    });

    await adminAuditService.logAction(
      principal,
      'EDIT_QUESTION',
      `Level ${levelNumber} (${playerRole})`,
      'Updated question content and expected answer'
    );

    return {
      id: saved.id,
      levelNumber,
      stageNumber: saved.stageNumber,
      playerNumber: saved.playerNumber,
      evidence: saved.evidence,
      instructions: saved.instructions,
      technicalCategory: saved.technicalCategory,
      difficulty: saved.difficulty,
      validationRules: saved.validationRules,
      puzzleMetadata: saved.puzzleMetadata,
      puzzleContext: saved.puzzleContext,
      expectedAnswer: saved.expectedAnswerHash,
      answerType: saved.answerType,
      isActive: saved.isActive,
      interdependentConfirmed: true
    };
  }

  async saveHintConfig(principal, eventId, levelNumber, dto) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    this._validateContentEditable(event);

    const level = await levelRepository.findByLevelNumber(levelNumber);
    if (!level) {
      throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);
    }

    const saved = await hintRepository.saveHintConfig({
      levelId: level.id,
      displayOrder: dto.displayOrder || 1,
      hintContent: (dto.hintContent || '').trim()
    });

    await adminAuditService.logAction(
      principal,
      'EDIT_HINT',
      `Level ${levelNumber}`,
      'Updated progressive hint content'
    );

    return {
      id: saved.id,
      levelNumber,
      hintContent: saved.hintContent,
      displayOrder: saved.displayOrder,
      isActive: saved.isActive
    };
  }

  async testAnswer(principal, eventId, request) {
    const level = await levelRepository.findByLevelNumber(request.levelNumber);
    if (!level) {
      throw new ResourceNotFoundException(`Level ${request.levelNumber} not found.`);
    }

    const role = (request.playerNumber === 1 || request.playerNumber === 'PLAYER_1') ? 'PLAYER_1' : 'PLAYER_2';
    const questions = await questionRepository.findByLevelId(level.id);
    const question = questions.find(q => q.playerNumber === role);

    if (!question) {
      throw new ResourceNotFoundException(`Question not found for Level ${request.levelNumber} Player ${role}`);
    }

    const submitted = (request.candidateAnswer || '').trim();
    const expected = (question.expectedAnswerHash || '').trim();
    const matches = (submitted.toLowerCase() === expected.toLowerCase());

    await adminAuditService.logAction(
      principal,
      'TEST_ANSWER_PREVIEW',
      `Level ${request.levelNumber} (${role})`,
      `Tested answer candidate (Result: ${matches ? 'CORRECT' : 'INCORRECT'})`
    );

    return {
      levelNumber: request.levelNumber,
      playerNumber: role,
      result: matches ? 'CORRECT' : 'INCORRECT'
    };
  }

  async getPlayerSafePreview(eventId, levelNumber, playerNumber) {
    const level = await levelRepository.findByLevelNumber(levelNumber);
    if (!level) {
      throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);
    }

    const role = (playerNumber === 1 || playerNumber === 'PLAYER_1') ? 'PLAYER_1' : 'PLAYER_2';
    const questions = await questionRepository.findByLevelId(level.id);
    const question = questions.find(q => q.playerNumber === role);

    const hints = await hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.id);
    const hintContent = (hints.length > 0 && hints[0].hintContent) ? hints[0].hintContent : 'No hint configured.';

    return {
      levelNumber,
      levelName: level.name,
      playerNumber: playerNumber === 'PLAYER_2' ? 2 : 1,
      evidence: question ? question.evidence : `No evidence configured for Player ${playerNumber}`,
      instructions: question ? question.instructions : 'No instructions configured.',
      puzzleContext: question ? question.puzzleContext : null,
      hintContent
    };
  }

  async getAllContentForEvent(eventId) {
    const readiness = await eventContentValidationService.validateEventReadiness(eventId);
    const levels = await levelRepository.findAllActive();
    const levelDetails = [];

    for (let i = 1; i <= 6; i++) {
      const lvlNum = i;
      const level = levels.find(l => l.levelNumber === lvlNum);
      const lvlMap = {
        levelNumber: lvlNum,
        levelName: level ? level.name : `Level ${lvlNum}`
      };

      if (level) {
        const questions = await questionRepository.findByLevelId(level.id);
        const q1 = questions.find(q => q.playerNumber === 'PLAYER_1' || q.playerNumber === 1);
        const q2 = questions.find(q => q.playerNumber === 'PLAYER_2' || q.playerNumber === 2);
        const hints = await hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.id);

        lvlMap.player1Evidence = q1 ? q1.evidence : '';
        lvlMap.player1Instructions = q1 ? q1.instructions : '';
        lvlMap.player1Answer = q1 ? q1.expectedAnswerHash : '';
        lvlMap.player1PuzzleContext = q1 ? q1.puzzleContext : '';

        lvlMap.player2Evidence = q2 ? q2.evidence : '';
        lvlMap.player2Instructions = q2 ? q2.instructions : '';
        lvlMap.player2Answer = q2 ? q2.expectedAnswerHash : '';
        lvlMap.player2PuzzleContext = q2 ? q2.puzzleContext : '';

        lvlMap.hint = hints.length > 0 ? hints[0].hintContent : '';
      } else {
        lvlMap.player1Evidence = '';
        lvlMap.player1Instructions = '';
        lvlMap.player1Answer = '';
        lvlMap.player2Evidence = '';
        lvlMap.player2Instructions = '';
        lvlMap.player2Answer = '';
        lvlMap.hint = '';
      }

      levelDetails.push(lvlMap);
    }

    return {
      readiness,
      levels: levelDetails
    };
  }

  _validateContentEditable(event) {
    if (event && (event.status === 'RUNNING' || event.status === 'COMPLETED')) {
      const err = new Error(`Event content is locked because the event is currently ${event.status}.`);
      err.status = 400;
      throw err;
    }
  }
}

module.exports = new AdminContentService();
