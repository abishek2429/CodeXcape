package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private Integer rank; // 1-based for completed teams, null for incomplete teams
    private Long teamId;
    private String teamCode;
    private String teamName;
    private TeamStatus status;
    private TeamGameState gameState;
    private Integer currentLevel;
    private String player1Name;
    private String player2Name;
    private Instant completedAt;
    private Long durationSeconds;
    private String formattedDuration; // e.g. "38m 42s"
}
