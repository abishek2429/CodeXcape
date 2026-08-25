package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.TeamStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamStatusRequest {

    @NotNull(message = "Team status is required")
    private TeamStatus status;
}
