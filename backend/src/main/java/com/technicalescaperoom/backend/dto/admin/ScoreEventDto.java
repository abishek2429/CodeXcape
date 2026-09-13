package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.ScoreEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreEventDto {
    private Long id;
    private Long teamId;
    private Long playerId;
    private Integer playerNumber;
    private String playerName;
    private ScoreEventType eventType;
    private String referenceId;
    private Integer pointsDelta;
    private String reason;
    private Instant createdAt;
}
