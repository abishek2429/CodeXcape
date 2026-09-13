package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatReportRequest {

    @NotBlank(message = "Event type must not be blank")
    private String eventType;

    private Long clientTimestamp;

    private String metadata;
}
