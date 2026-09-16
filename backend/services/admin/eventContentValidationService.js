const eventRepository = require('../../repositories/eventRepository');
const levelRepository = require('../../repositories/levelRepository');
const questionRepository = require('../../repositories/questionRepository');
const hintRepository = require('../../repositories/hintRepository');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

class EventContentValidationService {
  async validateEventReadiness(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    const errors = [];
    const levelSummaries = {};

    const levels = await levelRepository.findAllActive();
    const validLevelNumbers = levels.filter(l => l.levelNumber >= 1 && l.levelNumber <= 6);
    const levelsCountValid = validLevelNumbers.length === 6;

    if (!levelsCountValid) {
      errors.push(`Event configuration requires exactly 6 levels (found: ${levels.length}).`);
    }

    let allQuestionsOk = true;
    let allAnswersOk = true;
    let allHintsOk = true;

    for (let i = 1; i <= 6; i++) {
      const levelNum = i;
      const level = levels.find(l => l.levelNumber === levelNum);

      if (!level) {
        errors.push(`Level ${levelNum} is missing from event configuration.`);
        allQuestionsOk = false;
        allAnswersOk = false;
        allHintsOk = false;
        levelSummaries[levelNum] = {
          levelNumber: levelNum,
          levelName: `Level ${levelNum}`,
          player1QuestionConfigured: false,
          player2QuestionConfigured: false,
          player1AnswerConfigured: false,
          player2AnswerConfigured: false,
          hintConfigured: false,
          levelReady: false
        };
        continue;
      }

      const questions = await questionRepository.findByLevelId(level.id);
      const stages = Array.from(new Set(questions.map(q => q.stageNumber))).sort((a, b) => a - b);
      const hints = await hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.id);

      const stageGraphValid = stages.length >= 2 && stages.length <= 3;
      const stageCoverageValid = stageGraphValid && stages.every(stage => {
        const stageQuestions = questions.filter(q => q.stageNumber === stage);
        const p1Count = stageQuestions.filter(q => q.playerNumber === 'PLAYER_1' || q.playerNumber === 1).length;
        const p2Count = stageQuestions.filter(q => q.playerNumber === 'PLAYER_2' || q.playerNumber === 2).length;
        return stageQuestions.length === 2 && p1Count === 1 && p2Count === 1;
      });

      const p1Questions = questions.filter(q => q.playerNumber === 'PLAYER_1' || q.playerNumber === 1);
      const p2Questions = questions.filter(q => q.playerNumber === 'PLAYER_2' || q.playerNumber === 2);

      const p1Q = stageCoverageValid && p1Questions.every(q => q.evidence && q.evidence.trim().length > 0);
      const p2Q = stageCoverageValid && p2Questions.every(q => q.evidence && q.evidence.trim().length > 0);
      const p1A = stageCoverageValid && p1Questions.every(q => q.expectedAnswerHash && q.expectedAnswerHash.trim().length > 0);
      const p2A = stageCoverageValid && p2Questions.every(q => q.expectedAnswerHash && q.expectedAnswerHash.trim().length > 0);

      const hintOk = hints.some(h => h.isActive && h.hintContent && h.hintContent.trim().length > 0);

      if (!p1Q) {
        errors.push(`Level ${levelNum}: Player 1 question is missing or empty.`);
        allQuestionsOk = false;
      }
      if (!p2Q) {
        errors.push(`Level ${levelNum}: Player 2 question is missing or empty.`);
        allQuestionsOk = false;
      }
      if (!p1A) {
        errors.push(`Level ${levelNum}: Player 1 expected answer is missing.`);
        allAnswersOk = false;
      }
      if (!p2A) {
        errors.push(`Level ${levelNum}: Player 2 expected answer is missing.`);
        allAnswersOk = false;
      }
      if (!hintOk) {
        errors.push(`Level ${levelNum}: Progressive hint is missing or empty.`);
        allHintsOk = false;
      }

      const levelReady = p1Q && p2Q && p1A && p2A && hintOk;
      levelSummaries[levelNum] = {
        levelNumber: levelNum,
        levelName: level.name,
        player1QuestionConfigured: p1Q,
        player2QuestionConfigured: p2Q,
        player1AnswerConfigured: p1A,
        player2AnswerConfigured: p2A,
        hintConfigured: hintOk,
        levelReady
      };
    }

    // Final passkey validation
    const passkeyConfigured = Boolean(event.passkeyHash && event.passkeyHash.trim().length > 0);
    if (!passkeyConfigured) {
      errors.push('Final Terminal configuration: Secret 6-digit passkey hash is missing.');
    }

    const overallReady = levelsCountValid && allQuestionsOk && allAnswersOk && allHintsOk && passkeyConfigured;

    return {
      eventId: event.id,
      eventName: event.name,
      eventStatus: event.status,
      overallReady,
      levelsReady: levelsCountValid,
      questionsReady: allQuestionsOk,
      answersReady: allAnswersOk,
      hintsReady: allHintsOk,
      passkeyReady: passkeyConfigured,
      validationErrors: errors,
      levelSummaries
    };
  }
}

module.exports = new EventContentValidationService();
