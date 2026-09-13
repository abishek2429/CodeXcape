package com.technicalescaperoom.backend.dto.story;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveStoryStateDto {
    private boolean isStoryActive;
    private String storyKey;
    private Instant storyPausedAt;
    private Long currentPauseSeconds;
    private Long totalStoryPauseSeconds;
    private Long effectiveActiveDurationSeconds;
    private StorySequenceDto sequence;
    private List<String> completedStoryKeys;
}
