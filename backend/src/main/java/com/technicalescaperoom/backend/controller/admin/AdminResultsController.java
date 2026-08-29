package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.EventStatisticsDto;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import com.technicalescaperoom.backend.service.admin.ResultExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events/{eventId}")
@RequiredArgsConstructor
public class AdminResultsController {

    private final LeaderboardService leaderboardService;
    private final ResultExportService resultExportService;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard(@PathVariable Long eventId) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(eventId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/statistics")
    public ResponseEntity<EventStatisticsDto> getEventStatistics(@PathVariable Long eventId) {
        EventStatisticsDto stats = leaderboardService.getEventStatistics(eventId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping(value = "/export/results", produces = "text/csv")
    public ResponseEntity<String> exportResultsCsv(
            @PathVariable Long eventId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        String csv = resultExportService.generateEventResultsCsv(principal, eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"codexcape_event_" + eventId + "_results.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping(value = "/export/progress", produces = "text/csv")
    public ResponseEntity<String> exportProgressCsv(
            @PathVariable Long eventId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        String csv = resultExportService.generateTeamProgressCsv(principal, eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"codexcape_event_" + eventId + "_progress.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
