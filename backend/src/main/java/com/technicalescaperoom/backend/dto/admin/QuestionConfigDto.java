package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.AnswerType;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionConfigDto {
    private Long id;
    private Integer levelNumber;
    
    @NotNull
    private QuestionPlayer playerNumber;
    
    @NotBlank
    private String evidence;
    
    private String instructions;
    private String technicalCategory;
    private String difficulty;
    private String validationRules;
    private String puzzleMetadata;
    
    private String puzzleContext;
    
    @NotBlank
    private String expectedAnswer; // Normalized expected answer text set by organizer
    
    @NotNull
    @Builder.Default
    private AnswerType answerType = AnswerType.TEXT;
    
    @Builder.Default
    private Boolean isActive = true;

    private boolean interdependentConfirmed;
}
