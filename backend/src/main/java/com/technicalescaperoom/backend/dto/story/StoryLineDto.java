package com.technicalescaperoom.backend.dto.story;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryLineDto {
    private String characterId;
    private String characterName;
    private String characterTitle;
    private String imageUrl;
    private String text;
    @Builder.Default
    private Integer pauseAfterMs = 1200;
}
