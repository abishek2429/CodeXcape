const teamRepository = require('../repositories/teamRepository');
const scoreEventRepository = require('../repositories/scoreEventRepository');
const scoringConfig = require('../config/scoringConfig');
const webSocketService = require('./webSocketService');
const { withTransaction } = require('../config/db');

class ScoringService {
  recomputeFinalScore(team) {
    const base = team.baseScore || 0;
    const wrong = team.wrongAttemptPenalty || 0;
    const hint = team.hintPenalty || 0;
    const anti = team.antiCheatPenalty || 0;
    team.finalScore = Math.max(0, base - wrong - hint - anti);
    return team.finalScore;
  }

  async recordMiniGameCompletion(teamId, levelNumber, stageNumber) {
    const referenceId = `MINI_GAME_L${levelNumber}_S${stageNumber}`;
    const exists = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
    if (exists) return;

    await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) return;

      const alreadyRecorded = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
      if (alreadyRecorded) return;

      const points = scoringConfig.getPointsForMiniGame(levelNumber);
      team.baseScore = (team.baseScore || 0) + points;
      team.completedMiniGames = (team.completedMiniGames || 0) + 1;
      this.recomputeFinalScore(team);

      await scoreEventRepository.recordScoreEvent({
        teamId,
        eventType: 'MINI_GAME_COMPLETED',
        referenceId,
        pointsDelta: points,
        reason: `Completed Level ${levelNumber} Mini-Game ${stageNumber} (+${points} pts)`
      }, client);

      await teamRepository.save(team, client);
      this.broadcastScoreUpdate(team);
    });
  }

  async recordWrongAttempt(teamId, playerId, levelNumber, stageNumber, attemptId) {
    const referenceId = `WRONG_ATTEMPT_${attemptId}`;
    const exists = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
    if (exists) return;

    await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) return;

      const alreadyRecorded = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
      if (alreadyRecorded) return;

      const penalty = scoringConfig.WRONG_ATTEMPT_PENALTY;
      team.wrongAttemptPenalty = (team.wrongAttemptPenalty || 0) + penalty;
      this.recomputeFinalScore(team);

      await scoreEventRepository.recordScoreEvent({
        teamId,
        playerId,
        eventType: 'WRONG_ATTEMPT',
        referenceId,
        pointsDelta: -penalty,
        reason: `Incorrect attempt on Level ${levelNumber} Mini-Game ${stageNumber} (-${penalty} pts)`
      }, client);

      await teamRepository.save(team, client);
      this.broadcastScoreUpdate(team);
    });
  }

  async recordHintUsage(teamId, playerId, levelNumber, stageNumber, hintNumber) {
    const referenceId = `HINT_L${levelNumber}_S${stageNumber}`;
    const exists = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
    if (exists) return;

    await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) return;

      const alreadyRecorded = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
      if (alreadyRecorded) return;

      const penalty = scoringConfig.STAGE_HINT_PENALTY;
      team.hintPenalty = (team.hintPenalty || 0) + penalty;
      this.recomputeFinalScore(team);

      await scoreEventRepository.recordScoreEvent({
        teamId,
        playerId,
        eventType: 'HINT_USED',
        referenceId,
        pointsDelta: -penalty,
        reason: `Unlocked Level ${levelNumber} Stage ${stageNumber} Hint (-${penalty} pts)`
      }, client);

      await teamRepository.save(team, client);
      this.broadcastScoreUpdate(team);
    });
  }

  async recordFinalPasskeyCompletion(teamId, playerId) {
    const referenceId = 'FINAL_PROTOCOL_KEY';
    const exists = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
    if (exists) return;

    await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) return;

      const alreadyRecorded = await scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId);
      if (alreadyRecorded) return;

      const points = scoringConfig.FINAL_PROTOCOL_POINTS;
      team.baseScore = (team.baseScore || 0) + points;
      this.recomputeFinalScore(team);

      await scoreEventRepository.recordScoreEvent({
        teamId,
        playerId,
        eventType: 'FINAL_PASSKEY_SOLVED',
        referenceId,
        pointsDelta: points,
        reason: `Final Protocol Override Verified (+${points} pts)`
      }, client);

      await teamRepository.save(team, client);
      this.broadcastScoreUpdate(team);
    });
  }

  async recordAntiCheatPenalty(teamId, playerId, violationType, penaltyPoints) {
    await withTransaction(async (client) => {
      const team = await teamRepository.findForUpdateById(teamId, client);
      if (!team) return;

      team.antiCheatPenalty = (team.antiCheatPenalty || 0) + penaltyPoints;
      team.securityIncidentCount = (team.securityIncidentCount || 0) + 1;
      this.recomputeFinalScore(team);

      await scoreEventRepository.recordScoreEvent({
        teamId,
        playerId,
        eventType: 'PENALTY_APPLIED',
        referenceId: `AC_${violationType}_${Date.now()}`,
        pointsDelta: -penaltyPoints,
        reason: `Anti-cheat violation: ${violationType} (-${penaltyPoints} pts)`
      }, client);

      await teamRepository.save(team, client);
      this.broadcastScoreUpdate(team);
    });
  }

  async getTeamScoreSummary(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) return null;

    return {
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      baseScore: team.baseScore,
      wrongAttemptPenalty: team.wrongAttemptPenalty,
      hintPenalty: team.hintPenalty,
      antiCheatPenalty: team.antiCheatPenalty,
      finalScore: team.finalScore,
      completedMiniGames: team.completedMiniGames,
      completedLevels: team.completedLevels,
      totalLevels: 6,
      maxBaseScore: 1000
    };
  }

  async getTeamScoreEvents(teamId) {
    return scoreEventRepository.findByTeamId(teamId);
  }

  broadcastScoreUpdate(team) {
    const payload = {
      type: 'SCORE_UPDATED',
      teamId: team.id,
      teamCode: team.teamCode,
      baseScore: team.baseScore,
      finalScore: team.finalScore,
      completedMiniGames: team.completedMiniGames,
      completedLevels: team.completedLevels,
      timestamp: new Date().toISOString()
    };
    webSocketService.broadcastToTeam(team.id, payload);
    webSocketService.broadcastToAdmin(payload);
  }
}

module.exports = new ScoringService();
