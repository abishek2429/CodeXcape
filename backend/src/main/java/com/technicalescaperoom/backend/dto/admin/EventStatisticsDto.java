package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStatisticsDto {
    private Long eventId;
    private String eventName;
    private String eventStatus;
    private Long totalRegisteredTeams;
    private Long startedTeams;
    private Long activeTeams;
    private Long completedTeams;
    private Long notStartedTeams;
    private Long disconnectedTeams;
    private Long fastestCompletionSeconds;
    private String formattedFastestCompletion;
    private Long averageCompletionSeconds;
    private String formattedAverageCompletion;
    private Instant latestCompletionTime;
    private List<LevelStatisticsDto> levelBreakdown;
}
