package com.technicalescaperoom.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamRequest {

    @NotBlank(message = "Team name is required")
    private String teamName;

    @NotBlank(message = "Player 1 display name is required")
    private String player1DisplayName;

    @NotBlank(message = "Player 2 display name is required")
    private String player2DisplayName;

    private String customTeamCode;
}
