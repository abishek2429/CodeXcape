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
public class AdminTeamProgressDto {
    private Long teamId;
    private String teamCode;
    private String teamName;
    private TeamStatus status;
    private TeamGameState gameState;
    private Integer currentLevel;
    private Boolean player1Completed;
    private Boolean player2Completed;
    private String player1Name;
    private String player2Name;
    private Boolean player1Connected;
    private Boolean player2Connected;
    private String connectionStatus;
    private Long player1SessionId;
    private Long player2SessionId;
    private Integer hintsUnlocked;
    private Instant completedAt;
}
