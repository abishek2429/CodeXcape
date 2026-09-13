package com.technicalescaperoom.backend.dto.player;

import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatEventResponseDto {

    private boolean accepted;
    private boolean deduplicated;
    private Long incidentId;
    private AntiCheatViolationType violationType;
    private Integer penaltyPoints;
    private Integer teamTotalPenalties;
    private String message;
}
