package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerHintDto {
    private Integer levelNumber;
    private Integer hintNumber;
    private String hintContent;
    private Boolean isUnlocked;
}
