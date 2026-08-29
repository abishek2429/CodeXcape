package com.technicalescaperoom.backend.dto.publicapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicLeaderboardDto {
    private Long eventId;
    private String eventName;
    private String eventStatus;
    private List<PublicLeaderboardEntryDto> completedEntries;
    private List<PublicLeaderboardEntryDto> activeEntries;
}
