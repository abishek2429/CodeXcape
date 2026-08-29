package com.technicalescaperoom.backend.dto.admin;

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
public class AnswerTestRequestDto {
    @NotNull
    private Integer levelNumber;

    @NotNull
    private QuestionPlayer playerNumber;

    @NotBlank
    private String candidateAnswer;
}
