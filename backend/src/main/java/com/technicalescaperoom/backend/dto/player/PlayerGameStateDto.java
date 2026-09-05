package com.technicalescaperoom.backend.dto.player;

import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerGameStateDto {
    private String teamCode;
    private String teamName;
    private TeamGameState gameStatus;
    private Integer currentLevel;
    private Integer currentRank;
    private EventStatus eventStatus;
    private List<LevelProgressDto> levels;
    private Instant serverTime;
    private Instant deadline;
}
