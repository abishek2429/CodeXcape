package com.technicalescaperoom.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamImportRow {

    private int rowNumber;
    private String teamName;
    private String player1Name;
    private String player2Name;
    private String customTeamCode;

    @Builder.Default
    private boolean valid = true;

    @Builder.Default
    private List<String> validationErrors = new ArrayList<>();

    public void addError(String error) {
        this.valid = false;
        this.validationErrors.add(error);
    }
}
