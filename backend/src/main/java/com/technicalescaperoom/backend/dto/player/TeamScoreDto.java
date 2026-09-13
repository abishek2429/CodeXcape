package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamScoreDto {
    private Long teamId;
    private String teamCode;
    private String teamName;
    private Integer baseScore;
    private Integer wrongAttemptPenalty;
    private Integer hintPenalty;
    private Integer antiCheatPenalty;
    private Integer finalScore;
    private Integer completedMiniGames;
    private Integer totalMiniGames;
    private Integer completedLevels;
    private Integer totalLevels;
    private Integer currentRank;
}
