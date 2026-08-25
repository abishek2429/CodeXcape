package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String name;
    private String description;
    private EventStatus status;
    private Instant startTime;
    private Instant endTime;
    private long teamCount;
    private Instant createdAt;
    private Instant updatedAt;
}
