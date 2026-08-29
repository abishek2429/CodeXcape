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
public class PlayerHintsResponseDto {
    private List<PlayerHintDto> hints;
    private Integer unlockedCount;
    private Integer totalCount;
}
