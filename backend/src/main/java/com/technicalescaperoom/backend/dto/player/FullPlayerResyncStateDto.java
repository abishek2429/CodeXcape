package com.technicalescaperoom.backend.dto.player;

import com.technicalescaperoom.backend.enums.TeamGameState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FullPlayerResyncStateDto {
    private Long teamId;
    private String teamCode;
    private String teamName;
    private Integer playerNumber;
    private String displayName;
    private TeamGameState gameState;
    private Integer currentLevel;
    private Boolean isCompleted;
    private Instant completedAt;
    private Boolean partnerCompletedCurrentLevel;
    private Boolean myCompletedCurrentLevel;
    private PlayerQuestionDto currentQuestion;
    private List<PlayerHintDto> hints;
}
