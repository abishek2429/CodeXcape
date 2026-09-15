package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class RiddleDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiddleItemStateDto {
        private Integer riddleIndex;
        private Integer levelNumber;
        private String status; // "LOCKED" | "UNLOCKED" | "SOLVED"
        private String solvedDigit; // null if not solved
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiddleBoardStateResponseDto {
        private Integer totalRiddles;
        private Integer unlockedCount;
        private Integer solvedCount;
        private Boolean allRiddlesSolved;
        private List<RiddleItemStateDto> riddles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiddleSubmissionRequest {
        @NotNull(message = "Riddle index is required")
        @Min(value = 1, message = "Riddle index must be between 1 and 6")
        @Max(value = 6, message = "Riddle index must be between 1 and 6")
        private Integer riddleIndex;

        @NotBlank(message = "Answer digit is required")
        @Pattern(regexp = "^[0-9]$", message = "Answer must be exactly one digit (0-9)")
        private String digit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiddleSubmissionResponseDto {
        private Integer riddleIndex;
        private String status; // "SOLVED" | "INCORRECT" | "RATE_LIMITED" | "LOCKED"
        private String message;
        private String solvedDigit;
        private Boolean allRiddlesSolved;
    }
}
