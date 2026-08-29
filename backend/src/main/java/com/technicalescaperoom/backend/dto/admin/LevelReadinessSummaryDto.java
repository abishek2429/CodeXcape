package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelReadinessSummaryDto {
    private Integer levelNumber;
    private String levelName;
    private boolean player1QuestionConfigured;
    private boolean player2QuestionConfigured;
    private boolean player1AnswerConfigured;
    private boolean player2AnswerConfigured;
    private boolean hintConfigured;
    private boolean levelReady;
}
