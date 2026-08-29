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
    private Long disconnectedPlayers;
    private Long bothPlayersOnlineTeams;
    private Long onePlayerOfflineTeams;
    private Long bothPlayersOfflineTeams;
    private String serverStatus;
    private Long eventDurationSeconds;
    private java.time.Instant startTime;
    private java.time.Instant endTime;
    private Map<Integer, Long> levelDistribution;
}
