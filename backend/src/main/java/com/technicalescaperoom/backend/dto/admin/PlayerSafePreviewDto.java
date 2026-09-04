package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSafePreviewDto {
    private Integer levelNumber;
    private String levelName;
    private Integer playerNumber;
    private String evidence;
    private String instructions;
    private String puzzleContext;
    private String hintContent;
}
