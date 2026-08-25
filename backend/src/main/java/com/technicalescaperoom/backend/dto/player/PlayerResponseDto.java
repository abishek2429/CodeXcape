package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
