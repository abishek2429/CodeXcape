package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDto {
    private String status; // "UP", "DEGRADED", "DOWN"
    private String databaseStatus; // "UP", "DOWN"
    private String websocketStatus; // "UP"
    private long totalEvents;
    private long activeEvents;
    private Instant timestamp;
}
