package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmissionRequest {

    @NotBlank(message = "Answer submission cannot be blank")
    private String answer;

    private Integer levelNumber;

    private String interactionPayload;
}
