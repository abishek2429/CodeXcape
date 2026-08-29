package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.util.TeamCodeGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamExcelImportService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamCodeGenerator teamCodeGenerator;
    private final GameStateService gameStateService;
    private final AdminAuditService adminAuditService;

    private static final int MAX_TEAM_NAME_LENGTH = 100;
    private static final int MAX_PLAYER_NAME_LENGTH = 100;

    /**
     * Parse and validate an uploaded Excel file, returning a preview without importing.
     */
    public TeamImportPreviewDto parseAndValidate(Long eventId, MultipartFile file) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        validateEventEditable(event);
        validateFileFormat(file);

        List<TeamImportRow> rows = parseExcelFile(file);
        validateRows(rows, eventId);

        int validCount = (int) rows.stream().filter(TeamImportRow::isValid).count();
        int invalidCount = (int) rows.stream().filter(r -> !r.isValid()).count();
        int duplicateCount = (int) rows.stream()
                .filter(r -> r.getValidationErrors().stream().anyMatch(e -> e.contains("Duplicate")))
                .count();

        List<String> globalErrors = new ArrayList<>();
        if (rows.isEmpty()) {
            globalErrors.add("No data rows found in the Excel file.");
        }
        if (validCount == 0 && !rows.isEmpty()) {
            globalErrors.add("All rows have validation errors. No teams can be imported.");
        }

        List<String> warnings = new ArrayList<>();
        if (invalidCount > 0) {
            warnings.add(invalidCount + " row(s) have validation errors and will be skipped during import.");
        }

        return TeamImportPreviewDto.builder()
                .totalRows(rows.size())
                .validRows(validCount)
                .invalidRows(invalidCount)
                .duplicateRows(duplicateCount)
                .rows(rows)
                .errors(globalErrors)
                .warnings(warnings)
                .importReady(validCount > 0 && globalErrors.isEmpty())
                .build();
    }

    /**
     * Import validated teams from a previously parsed Excel preview.
     * Entire operation is atomic — any failure rolls back all created teams.
     */
    @Transactional
    public TeamImportResultDto importTeams(Long eventId, MultipartFile file,
                                           com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        validateEventEditable(event);

        List<TeamImportRow> rows = parseExcelFile(file);
        validateRows(rows, eventId);

        List<TeamImportRow> validRows = rows.stream()
                .filter(TeamImportRow::isValid)
                .collect(Collectors.toList());

        if (validRows.isEmpty()) {
            return TeamImportResultDto.builder()
                    .teamsCreated(0)
                    .playersCreated(0)
                    .duplicatesSkipped(rows.size())
                    .errorsEncountered(rows.size())
                    .errors(List.of("No valid rows to import."))
                    .summary("Import aborted: no valid team rows found.")
                    .build();
        }

        int teamsCreated = 0;
        int playersCreated = 0;
        List<String> createdCodes = new ArrayList<>();
        List<String> importErrors = new ArrayList<>();

        long currentTeamCount = teamRepository.countByEventId(eventId);

        for (TeamImportRow row : validRows) {
            try {
                // Generate unique team code
                long countForCode = currentTeamCount + teamsCreated;
                String teamCode = teamCodeGenerator.generateUniqueTeamCode(countForCode,
                        code -> teamRepository.existsByEventIdAndTeamCode(eventId, code));

                Team team = Team.builder()
                        .event(event)
                        .teamCode(teamCode)
                        .teamName(row.getTeamName().trim())
                        .status(TeamStatus.REGISTERED)
                        .build();

                Team savedTeam = teamRepository.save(team);

                Player p1 = Player.builder()
                        .team(savedTeam)
                        .playerNumber(1)
                        .displayName(row.getPlayer1Name().trim())
                        .status(PlayerStatus.INACTIVE)
                        .build();

                Player p2 = Player.builder()
                        .team(savedTeam)
                        .playerNumber(2)
                        .displayName(row.getPlayer2Name().trim())
                        .status(PlayerStatus.INACTIVE)
                        .build();

                playerRepository.save(p1);
                playerRepository.save(p2);

                gameStateService.initializeTeamGameState(savedTeam);

                teamsCreated++;
                playersCreated += 2;
                createdCodes.add(teamCode);

                log.info("Imported team '{}' (code: {}) with players '{}' and '{}'",
                        row.getTeamName(), teamCode, row.getPlayer1Name(), row.getPlayer2Name());

            } catch (Exception e) {
                importErrors.add("Row " + row.getRowNumber() + " ('" + row.getTeamName() + "'): " + e.getMessage());
                log.error("Failed to import team from row {}: {}", row.getRowNumber(), e.getMessage());
                throw new RuntimeException("Import failed at row " + row.getRowNumber() + ": " + e.getMessage(), e);
            }
        }

        int duplicatesSkipped = rows.size() - validRows.size();

        adminAuditService.logAction(
                principal,
                "EXCEL_TEAM_IMPORT",
                "Event #" + eventId,
                "Imported " + teamsCreated + " teams (" + playersCreated + " players) from Excel. "
                        + duplicatesSkipped + " rows skipped."
        );

        String summary = String.format(
                "Import complete: %d teams created, %d players created, %d rows skipped.",
                teamsCreated, playersCreated, duplicatesSkipped
        );

        return TeamImportResultDto.builder()
                .teamsCreated(teamsCreated)
                .playersCreated(playersCreated)
                .duplicatesSkipped(duplicatesSkipped)
                .errorsEncountered(importErrors.size())
                .createdTeamCodes(createdCodes)
                .errors(importErrors)
                .importTimestamp(Instant.now())
                .summary(summary)
                .build();
    }

    // ---- Internal Helpers ----

    private List<TeamImportRow> parseExcelFile(MultipartFile file) {
        List<TeamImportRow> rows = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new IllegalArgumentException("Excel file contains no sheets.");
            }

            int lastRow = sheet.getLastRowNum();

            // Start from row 1 (row 0 is header)
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String teamName = getCellStringValue(row.getCell(0));
                String player1Name = getCellStringValue(row.getCell(1));
                String player2Name = getCellStringValue(row.getCell(2));

                // Skip completely empty rows
                if (isBlank(teamName) && isBlank(player1Name) && isBlank(player2Name)) {
                    continue;
                }

                TeamImportRow importRow = TeamImportRow.builder()
                        .rowNumber(i + 1) // 1-indexed for user display
                        .teamName(teamName != null ? teamName.trim() : null)
                        .player1Name(player1Name != null ? player1Name.trim() : null)
                        .player2Name(player2Name != null ? player2Name.trim() : null)
                        .build();

                rows.add(importRow);
            }

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse Excel file: " + e.getMessage(), e);
        }

        return rows;
    }

    private void validateRows(List<TeamImportRow> rows, Long eventId) {
        Set<String> seenTeamNames = new HashSet<>();
        List<Team> existingTeams = teamRepository.findByEventId(eventId);
        Set<String> existingTeamNames = existingTeams.stream()
                .map(t -> t.getTeamName() != null ? t.getTeamName().toLowerCase().trim() : "")
                .collect(Collectors.toSet());

        for (TeamImportRow row : rows) {
            // Validate team name
            if (isBlank(row.getTeamName())) {
                row.addError("Team name is missing.");
            } else if (row.getTeamName().length() > MAX_TEAM_NAME_LENGTH) {
                row.addError("Team name exceeds " + MAX_TEAM_NAME_LENGTH + " characters.");
            } else if (containsInvalidCharacters(row.getTeamName())) {
                row.addError("Team name contains invalid characters.");
            } else {
                String normalizedName = row.getTeamName().toLowerCase().trim();
                if (seenTeamNames.contains(normalizedName)) {
                    row.addError("Duplicate team name within this import file.");
                } else if (existingTeamNames.contains(normalizedName)) {
                    row.addError("Duplicate: team name already exists in this event.");
                } else {
                    seenTeamNames.add(normalizedName);
                }
            }

            // Validate Player 1
            if (isBlank(row.getPlayer1Name())) {
                row.addError("Player 1 name is missing.");
            } else if (row.getPlayer1Name().length() > MAX_PLAYER_NAME_LENGTH) {
                row.addError("Player 1 name exceeds " + MAX_PLAYER_NAME_LENGTH + " characters.");
            }

            // Validate Player 2
            if (isBlank(row.getPlayer2Name())) {
                row.addError("Player 2 name is missing.");
            } else if (row.getPlayer2Name().length() > MAX_PLAYER_NAME_LENGTH) {
                row.addError("Player 2 name exceeds " + MAX_PLAYER_NAME_LENGTH + " characters.");
            }

            // Validate players are not the same
            if (!isBlank(row.getPlayer1Name()) && !isBlank(row.getPlayer2Name())
                    && row.getPlayer1Name().trim().equalsIgnoreCase(row.getPlayer2Name().trim())) {
                row.addError("Player 1 and Player 2 cannot have the same name.");
            }
        }
    }

    private void validateEventEditable(Event event) {
        if (event.getStatus() == EventStatus.RUNNING || event.getStatus() == EventStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Cannot import teams: event is currently " + event.getStatus() + ".");
        }
    }

    private void validateFileFormat(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            throw new IllegalArgumentException(
                    "Invalid file format. Please upload an Excel file (.xlsx).");
        }

        // Max 5MB file size check
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 5MB limit.");
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                    yield String.valueOf((long) numVal);
                }
                yield String.valueOf(numVal);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> null;
        };
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean containsInvalidCharacters(String s) {
        // Allow alphanumeric, spaces, hyphens, underscores, dots, and common symbols
        return !s.matches("^[\\p{L}\\p{N}\\s\\-_.'&!@#]+$");
    }
}
