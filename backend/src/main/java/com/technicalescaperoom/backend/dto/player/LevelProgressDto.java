package com.technicalescaperoom.backend.dto.player;

import com.technicalescaperoom.backend.enums.LevelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelProgressDto {
    private Integer levelNumber;
    private String name;
    private LevelStatus status;
}
