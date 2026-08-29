package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponseDto {
    private Long eventId;
    private String eventName;
    private EventStatus eventStatus;
    private Long totalTeams;
    private Long activeTeams;
    private Long completedTeams;
    private Map<Integer, Long> levelDistribution;
}
