package com.technicalescaperoom.backend.dto.publicapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicLeaderboardEntryDto {
    private Integer rank; // Null for incomplete teams
    private String teamName;
    private String status; // "COMPLETED" or "IN_PROGRESS"
    private Integer currentLevel;
    private String formattedDuration;
}
