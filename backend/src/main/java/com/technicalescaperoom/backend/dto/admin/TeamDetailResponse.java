package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.TeamStatus;
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
public class TeamDetailResponse {
    private Long id;
    private Long eventId;
    private String eventName;
    private String teamCode;
    private String teamName;
    private TeamStatus status;
    private Instant completedAt;
    private List<PlayerDto> players;
    private Instant createdAt;
    private Instant updatedAt;
}
