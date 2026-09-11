package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerResponseDto {
    private String teamCode;
    private String teamName;
    private Integer playerNumber;
    private String playerName;
    private String status;
    private Long eventId;
    private Long teamId;
    private Long playerId;
    private Boolean isActive;

    // Team Lobby & Event Start Telemetry
    private Boolean isReady;
    private String gameState;
    private String eventStatus;
    private Instant eventStartedAt;
    private Integer currentLevel;
    private Integer currentStage;

    // Teammate Telemetry
    private String teammateName;
    private Integer teammateNumber;
    private Boolean teammateLoggedIn;
    private Boolean teammateReady;

    // Authentication token fallback
    private String sessionToken;
}
