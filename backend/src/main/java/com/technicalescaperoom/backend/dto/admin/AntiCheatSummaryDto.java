package com.technicalescaperoom.backend.dto.admin;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatSummaryDto {

    private Long teamId;
    private String teamCode;
    private String teamName;
    private Integer totalPenaltyPoints;
    private Integer totalViolations;
    private Integer tabSwitchCount;
    private Integer fullscreenExitCount;
    private Integer prolongedHiddenCount;
    private Instant lastViolationAt;
}
