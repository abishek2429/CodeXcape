package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerTestResponseDto {
    private String result; // "CORRECT" or "INCORRECT"
    private Integer levelNumber;
    private String playerNumber;
}
