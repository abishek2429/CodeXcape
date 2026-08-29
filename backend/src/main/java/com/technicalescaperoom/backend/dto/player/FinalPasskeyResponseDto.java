package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalPasskeyResponseDto {
    private String status; // "COMPLETED", "INCORRECT", "FINAL_NOT_AVAILABLE", "ALREADY_COMPLETED"
    private String message;
    private Instant completedAt;
}
