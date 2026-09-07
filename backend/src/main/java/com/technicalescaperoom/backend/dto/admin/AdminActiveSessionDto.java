package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActiveSessionDto {
    private Long sessionId;
    private Long teamId;
    private String teamCode;
    private String teamName;
    private Long playerId;
    private Integer playerNumber;
    private String playerName;
    private String playerRole; // "OPERATOR" or "ANALYZER"
    private PlayerStatus playerStatus;
    private Boolean isReady;
    private String sessionToken;
    private String sessionTokenPreview;
    private SessionStatus sessionStatus;
    private Boolean isConnected;
    private Instant createdAt;
    private Instant lastActivityAt;
    private TeamGameState teamGameState;
}
