package com.technicalescaperoom.backend.dto.story;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorySequenceDto {
    private String storyKey;
    private String title;
    private String subTitle;
    private List<StoryLineDto> lines;
    @Builder.Default
    private boolean canSkip = true;
}
