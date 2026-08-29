package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventReadinessDto {
    private Long eventId;
    private String eventName;
    private String eventStatus;
    private boolean overallReady;
    private boolean levelsReady;
    private boolean questionsReady;
    private boolean answersReady;
    private boolean hintsReady;
    private boolean passkeyReady;
    private List<String> validationErrors;
    private Map<Integer, LevelReadinessSummaryDto> levelSummaries;
}
