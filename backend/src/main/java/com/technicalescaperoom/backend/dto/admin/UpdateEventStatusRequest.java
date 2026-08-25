package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventStatusRequest {

    @NotNull(message = "Event status is required")
    private EventStatus status;
}
