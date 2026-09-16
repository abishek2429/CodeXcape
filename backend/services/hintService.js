const teamRepository = require('../repositories/teamRepository');
const levelRepository = require('../repositories/levelRepository');
const hintRepository = require('../repositories/hintRepository');
const hintUsageRepository = require('../repositories/hintUsageRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const teamStageProgressRepository = require('../repositories/teamStageProgressRepository');
const scoringService = require('./scoringService');
const webSocketService = require('./webSocketService');
const {
  ResourceNotFoundException,
  EventUnavailableException,
  InvalidLevelTransitionException
} = require('../middleware/errorHandler');

class HintService {
  async getHintsForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    const usedHints = await hintUsageRepository.findByTeamId(team.id);
    const usedHintKeys = new Set(usedHints.map(u => `${u.levelNumber}_${u.stageNumber}`));

    const activeLevels = await levelRepository.findAllActive();
    const hintDtos = [];
    let unlockedCount = 0;

    for (const level of activeLevels) {
      const levelHints = await hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.id);
      const stageHintMap = new Map();
      for (const h of levelHints) {
        if (!stageHintMap.has(h.stageNumber)) {
          stageHintMap.set(h.stageNumber, h);
        }
      }

      const stagesInLevel = (level.levelNumber >= 4) ? 3 : 2;
      for (let s = 1; s <= stagesInLevel; s++) {
        const hint = stageHintMap.get(s);
        const key = `${level.levelNumber}_${s}`;
        const isUnlocked = usedHintKeys.has(key);
        const content = (isUnlocked && hint) ? hint.hintContent : null;

        if (isUnlocked) unlockedCount++;

        hintDtos.push({
          levelNumber: level.levelNumber,
          stageNumber: s,
          hintNumber: 1,
          isUnlocked,
          hintContent: content
        });
      }
    }

    return {
      hints: hintDtos,
      unlockedCount,
      totalCount: hintDtos.length
    };
  }

  async useHint(principal, levelNumber, stageNumber, hintNumber = 1) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');

    if (team.gameState === 'COMPLETED') {
      throw new EventUnavailableException('Game is not currently active for hint requests.');
    }

    const level = await levelRepository.findByLevelNumber(levelNumber);
    if (!level) throw new ResourceNotFoundException(`Level ${levelNumber} not found.`);

    // Server-authoritative progression boundary check: prevent requesting hints for future levels or stages
    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    const activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );

    let activeLevelNumber = 1;
    let activeStageNumber = 1;
    if (activeProgress) {
      activeLevelNumber = activeProgress.level.levelNumber;
      const questionAnswerService = require('./questionAnswerService');
      activeStageNumber = await questionAnswerService.findCurrentStage(team.id, activeProgress.levelId, activeLevelNumber);
    }

    if (levelNumber > activeLevelNumber || (levelNumber === activeLevelNumber && stageNumber > activeStageNumber)) {
      throw new InvalidLevelTransitionException('Cannot request hints for future levels or stages before reaching them.');
    }

    const alreadyUsed = await hintUsageRepository.existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(
      team.id, level.id, stageNumber, 1
    );

    const hints = await hintRepository.findByLevelIdAndStageNumberOrderByDisplayOrderAsc(level.id, stageNumber);
    const targetHintNumber = (hintNumber && hintNumber > 0) ? hintNumber : 1;
    const hint = hints.find(h => h.displayOrder === targetHintNumber) || hints[0];

    if (!hint) {
      throw new ResourceNotFoundException(`Hint ${targetHintNumber} not configured for Level ${levelNumber} Stage ${stageNumber}`);
    }

    if (!alreadyUsed) {
      await hintUsageRepository.recordUsage(team.id, level.id, stageNumber, 1);
      await scoringService.recordHintUsage(team.id, principal.playerId, levelNumber, stageNumber, 1);
      webSocketService.notifyHintUnlocked(team.id, levelNumber, 1);
    }

    return {
      levelNumber,
      stageNumber,
      hintNumber: 1,
      hintContent: hint.hintContent,
      alreadyUsed
    };
  }
}

module.exports = new HintService();
