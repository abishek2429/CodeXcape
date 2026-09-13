package com.technicalescaperoom.backend.dto.admin;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatEventAuditDto {

    private Long id;
    private Long teamId;
    private String teamCode;
    private String teamName;
    private Long playerId;
    private String playerName;
    private Integer playerNumber;
    private String violationType;
    private Integer penaltyPoints;
    private Long durationMs;
    private Instant detectedAt;
    private String metadata;
}
