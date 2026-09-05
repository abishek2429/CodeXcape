package com.technicalescaperoom.backend.dto.player;

import com.technicalescaperoom.backend.enums.AnswerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerQuestionDto {
    private Integer levelNumber;
    private Integer stageNumber;
    private Integer totalStages;
    private Long questionId;
    private String puzzleContext;
    private String evidence;
    private String instructions;
    private String puzzleMetadata;
    private AnswerType answerType;
    private Boolean isCompleted;
    private Integer attemptCount;
}
