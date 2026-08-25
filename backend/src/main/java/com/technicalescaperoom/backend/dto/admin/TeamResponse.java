package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {
    private Long id;
    private Long eventId;
    private String teamCode;
    private String teamName;
    private TeamStatus status;
    private String player1DisplayName;
    private String player2DisplayName;
    private Instant createdAt;
    private Instant updatedAt;
}
