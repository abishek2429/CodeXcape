package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamImportResultDto {

    private int teamsCreated;
    private int playersCreated;
    private int duplicatesSkipped;
    private int errorsEncountered;

    @Builder.Default
    private List<String> createdTeamCodes = new ArrayList<>();

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    @Builder.Default
    private Instant importTimestamp = Instant.now();

    private String summary;
}
