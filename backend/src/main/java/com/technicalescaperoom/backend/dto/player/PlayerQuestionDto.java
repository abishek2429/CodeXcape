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
    private Long questionId;
    private String puzzleContext;
    private String questionContent;
    private AnswerType answerType;
    private Boolean isCompleted;
    private Integer attemptCount;
}
