package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatReportRequest {

    @NotBlank(message = "Event type must not be blank")
    @Size(max = 50, message = "Event type must not exceed 50 characters")
    private String eventType;

    private Long clientTimestamp;

    @Size(max = 255, message = "Metadata must not exceed 255 characters")
    private String metadata;
}
