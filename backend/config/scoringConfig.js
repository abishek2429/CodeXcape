/**
 * Centralized, authoritative scoring configuration for CodeXcape.
 * Mirrors com.technicalescaperoom.backend.config.ScoringConfig
 */
const ScoringConfig = {
  TOTAL_LEVELS: 6,
  TOTAL_MINI_GAMES: 15,
  MAX_BASE_SCORE: 1000,

  // Mini-game Base Points by Level (15 total stages across 6 levels)
  LEVEL_1_MINI_GAME_POINTS: 60,
  LEVEL_2_MINI_GAME_POINTS: 60,
  LEVEL_3_MINI_GAME_POINTS: 65,
  LEVEL_4_MINI_GAME_POINTS: 65,
  LEVEL_5_MINI_GAME_POINTS: 70,
  LEVEL_6_MINI_GAME_POINTS: 70,
  FINAL_PROTOCOL_POINTS: 15,

  // Wrong Attempt Penalty
  WRONG_ATTEMPT_PENALTY: 5, // -5 points per valid incorrect submission

  // Stage Hint Penalty: Exactly 5 points per revealed stage hint
  STAGE_HINT_PENALTY: 5,
  HINT_1_PENALTY: 5,
  HINT_2_PENALTY: 5,
  HINT_3_PENALTY: 5,

  // Escalating Tab Switch Penalties (per team)
  TAB_SWITCH_ESCALATING_PENALTIES: [10, 15, 20, 30, 40],

  // Escalating Fullscreen Exit Penalties (per team)
  FULLSCREEN_EXIT_ESCALATING_PENALTIES: [15, 20, 30, 40],

  LEVEL_POINT_MAP: {
    1: 60,
    2: 60,
    3: 65,
    4: 65,
    5: 70,
    6: 70
  },

  getPointsForMiniGame(levelNumber) {
    return this.LEVEL_POINT_MAP[levelNumber] || 60;
  },

  getTabSwitchPenalty(violationCount) {
    const idx = Math.min(Math.max(0, violationCount - 1), this.TAB_SWITCH_ESCALATING_PENALTIES.length - 1);
    return this.TAB_SWITCH_ESCALATING_PENALTIES[idx];
  },

  getFullscreenExitPenalty(violationCount) {
    const idx = Math.min(Math.max(0, violationCount - 1), this.FULLSCREEN_EXIT_ESCALATING_PENALTIES.length - 1);
    return this.FULLSCREEN_EXIT_ESCALATING_PENALTIES[idx];
  }
};

module.exports = ScoringConfig;
