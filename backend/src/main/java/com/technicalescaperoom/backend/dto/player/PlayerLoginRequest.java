package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class PlayerLoginRequest {

    @NotBlank(message = "Team code is required")
    private String teamCode;

    @NotNull(message = "Player number is required")
    @Min(value = 1, message = "Player number must be 1 or 2")
    @Max(value = 2, message = "Player number must be 1 or 2")
    private Integer playerNumber;
}
