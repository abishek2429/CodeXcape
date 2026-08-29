package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelStatisticsDto {
    private Integer levelNumber;
    private String levelName;
    private Long teamsReached;
    private Long teamsCompleted;
    private Long currentlyHere;
}
