package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryFragmentDto {
    private int fragmentNumber;
    private String title;
    private String status; // "UNLOCKED" or "ENCRYPTED"
    private String technicalArtifact;
    private String narrativeContent;
}
