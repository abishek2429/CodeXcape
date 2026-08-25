package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.TeamStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamRequest {

    @NotBlank(message = "Team name is required")
    private String teamName;

    @NotNull(message = "Team status is required")
    private TeamStatus status;

    @NotBlank(message = "Player 1 display name is required")
    private String player1DisplayName;

    @NotBlank(message = "Player 2 display name is required")
    private String player2DisplayName;
}
