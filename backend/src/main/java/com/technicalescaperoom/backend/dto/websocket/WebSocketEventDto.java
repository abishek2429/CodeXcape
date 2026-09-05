package com.technicalescaperoom.backend.dto.websocket;

import com.technicalescaperoom.backend.enums.WebSocketEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEventDto {
    private WebSocketEventType type;
    private Long teamId;
    private Long playerId;
    private Integer playerNumber;
    private String displayName;
    private Integer levelNumber;
    private Integer stageNumber;
    private Integer nextStageNumber;
    private Integer nextLevelNumber;
    private Integer newRank;
    private String discoveryKey;
    private Instant serverTime;
    private String message;
    
    @Builder.Default
    private Instant timestamp = Instant.now();
}
