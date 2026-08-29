package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResultExportService {

    private final LeaderboardService leaderboardService;
    private final AdminAuditService adminAuditService;

    public String generateEventResultsCsv(AdminPrincipal principal, Long eventId) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(eventId);

        StringBuilder csv = new StringBuilder();
        csv.append("Rank,Team Name,Player 1,Player 2,Status,Current Level,Completed At,Duration\n");

        for (LeaderboardEntryDto entry : leaderboard) {
            String rankStr = (entry.getRank() != null) ? entry.getRank().toString() : "-";
            String completedAtStr = (entry.getCompletedAt() != null)
                    ? DateTimeFormatter.ISO_INSTANT.format(entry.getCompletedAt())
                    : "-";

            csv.append(escapeCsv(rankStr)).append(",")
                    .append(escapeCsv(entry.getTeamName())).append(",")
                    .append(escapeCsv(entry.getPlayer1Name())).append(",")
                    .append(escapeCsv(entry.getPlayer2Name())).append(",")
                    .append(escapeCsv(entry.getGameState().name())).append(",")
                    .append(entry.getCurrentLevel()).append(",")
                    .append(escapeCsv(completedAtStr)).append(",")
                    .append(escapeCsv(entry.getFormattedDuration())).append("\n");
        }

        adminAuditService.logAction(
                principal,
                "EXPORT_RESULTS_CSV",
                "Event #" + eventId,
                "Exported event completion results CSV (" + leaderboard.size() + " teams)"
        );

        log.info("Admin {} exported event results CSV for Event #{}",
                principal != null ? principal.getUsername() : "SYSTEM", eventId);

        return csv.toString();
    }

    public String generateTeamProgressCsv(AdminPrincipal principal, Long eventId) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(eventId);

        StringBuilder csv = new StringBuilder();
        csv.append("Team Code,Team Name,Player 1,Player 2,Status,Game State,Current Level,Completed At\n");

        for (LeaderboardEntryDto entry : leaderboard) {
            String completedAtStr = (entry.getCompletedAt() != null)
                    ? DateTimeFormatter.ISO_INSTANT.format(entry.getCompletedAt())
                    : "-";

            csv.append(escapeCsv(entry.getTeamCode())).append(",")
                    .append(escapeCsv(entry.getTeamName())).append(",")
                    .append(escapeCsv(entry.getPlayer1Name())).append(",")
                    .append(escapeCsv(entry.getPlayer2Name())).append(",")
                    .append(escapeCsv(entry.getStatus().name())).append(",")
                    .append(escapeCsv(entry.getGameState().name())).append(",")
                    .append(entry.getCurrentLevel()).append(",")
                    .append(escapeCsv(completedAtStr)).append("\n");
        }

        adminAuditService.logAction(
                principal,
                "EXPORT_PROGRESS_CSV",
                "Event #" + eventId,
                "Exported operational team progress CSV (" + leaderboard.size() + " teams)"
        );

        return csv.toString();
    }

    private String escapeCsv(String input) {
        if (input == null) return "\"\"";
        String escaped = input.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
