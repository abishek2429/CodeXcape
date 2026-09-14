package com.technicalescaperoom.backend.config;

import lombok.Getter;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Centralized, authoritative scoring configuration for CodeXcape.
 * Defines all point awards, penalties, escalating anti-cheat tiers,
 * and game structure constants.
 */
@Getter
@Configuration
public class ScoringConfig {

    // Total Game Structure
    public static final int TOTAL_LEVELS = 6;
    public static final int TOTAL_MINI_GAMES = 15;
    public static final int MAX_BASE_SCORE = 1000;

    // Mini-game Base Points by Level (15 total stages across 6 levels)
    // Level 1 (2 stages): 2 * 60 = 120
    // Level 2 (2 stages): 2 * 60 = 120
    // Level 3 (2 stages): 2 * 65 = 130
    // Level 4 (3 stages): 3 * 65 = 195
    // Level 5 (3 stages): 3 * 70 = 210
    // Level 6 (3 stages): 3 * 70 = 210
    // Subtotal: 120 + 120 + 130 + 195 + 210 + 210 = 985
    // Final Protocol: 15
    // Total Base Score: 985 + 15 = 1000 points
    public static final int LEVEL_1_MINI_GAME_POINTS = 60;
    public static final int LEVEL_2_MINI_GAME_POINTS = 60;
    public static final int LEVEL_3_MINI_GAME_POINTS = 65;
    public static final int LEVEL_4_MINI_GAME_POINTS = 65;
    public static final int LEVEL_5_MINI_GAME_POINTS = 70;
    public static final int LEVEL_6_MINI_GAME_POINTS = 70;
    public static final int FINAL_PROTOCOL_POINTS = 15;

    // Wrong Attempt Penalty
    public static final int WRONG_ATTEMPT_PENALTY = 5; // -5 points per valid incorrect submission

    // Progressive Hint Penalties per mini-game (up to 3 hints)
    public static final int HINT_1_PENALTY = 5;  // -5
    public static final int HINT_2_PENALTY = 10; // -10
    public static final int HINT_3_PENALTY = 15; // -15 (Total for 3 hints: -30)

    // Escalating Tab Switch Penalties (per team)
    // 1st: -10, 2nd: -15, 3rd: -20, 4th: -30, 5th+: -40
    public static final int[] TAB_SWITCH_ESCALATING_PENALTIES = {10, 15, 20, 30, 40};

    // Escalating Fullscreen Exit Penalties (per team)
    // 1st: -15, 2nd: -20, 3rd: -30, 4th+: -40
    public static final int[] FULLSCREEN_EXIT_ESCALATING_PENALTIES = {15, 20, 30, 40};

    private static final Map<Integer, Integer> LEVEL_POINT_MAP = Map.of(
            1, LEVEL_1_MINI_GAME_POINTS,
            2, LEVEL_2_MINI_GAME_POINTS,
            3, LEVEL_3_MINI_GAME_POINTS,
            4, LEVEL_4_MINI_GAME_POINTS,
            5, LEVEL_5_MINI_GAME_POINTS,
            6, LEVEL_6_MINI_GAME_POINTS
    );

    public int getPointsForMiniGame(int levelNumber) {
        return LEVEL_POINT_MAP.getOrDefault(levelNumber, 50);
    }

    public int getPenaltyForHint(int hintNumber) {
        return switch (hintNumber) {
            case 1 -> HINT_1_PENALTY;
            case 2 -> HINT_2_PENALTY;
            case 3 -> HINT_3_PENALTY;
            default -> 0;
        };
    }

    public int getEscalatingTabSwitchPenalty(int incidentNumber) {
        if (incidentNumber <= 0) return 0;
        int index = Math.min(incidentNumber - 1, TAB_SWITCH_ESCALATING_PENALTIES.length - 1);
        return TAB_SWITCH_ESCALATING_PENALTIES[index];
    }

    public int getEscalatingFullscreenPenalty(int incidentNumber) {
        if (incidentNumber <= 0) return 0;
        int index = Math.min(incidentNumber - 1, FULLSCREEN_EXIT_ESCALATING_PENALTIES.length - 1);
        return FULLSCREEN_EXIT_ESCALATING_PENALTIES[index];
    }

    public int getMaxHintPenaltyPerMiniGame() {
        return HINT_1_PENALTY + HINT_2_PENALTY + HINT_3_PENALTY;
    }
}
