package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.EventStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRequest {

    @NotBlank(message = "Event name is required")
    private String name;

    private String description;

    @NotNull(message = "Event status is required")
    private EventStatus status;

    private Instant startTime;

    private Instant endTime;
}
