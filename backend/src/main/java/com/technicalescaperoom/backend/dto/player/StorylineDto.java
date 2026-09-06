package com.technicalescaperoom.backend.dto.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorylineDto {
    private int currentLevel;
    private String themeTitle;
    private int networkIntegrityPercent;
    private String activeObjective;
    private String playerPerspectiveLog;
    private String environmentalAlert;
    private String latestUnlockNarrative;
    private List<RecoveryFragmentDto> fragments;
}
