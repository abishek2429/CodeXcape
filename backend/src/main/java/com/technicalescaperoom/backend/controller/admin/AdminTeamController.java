package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.service.TeamService;
import com.technicalescaperoom.backend.service.admin.TeamExcelImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminTeamController {

    private final TeamService teamService;
    private final TeamExcelImportService teamExcelImportService;

    @PostMapping("/events/{eventId}/teams")
    public ResponseEntity<TeamDetailResponse> createTeam(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateTeamRequest request) {
        TeamDetailResponse response = teamService.createTeam(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/teams/{teamId}")
    public ResponseEntity<TeamDetailResponse> getTeam(@PathVariable Long teamId) {
        TeamDetailResponse response = teamService.getTeamById(teamId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/events/{eventId}/teams")
    public ResponseEntity<List<TeamResponse>> listTeamsForEvent(@PathVariable Long eventId) {
        List<TeamResponse> response = teamService.getTeamsByEventId(eventId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/teams/{teamId}")
    public ResponseEntity<TeamDetailResponse> updateTeam(
            @PathVariable Long teamId,
            @Valid @RequestBody UpdateTeamRequest request) {
        TeamDetailResponse response = teamService.updateTeam(teamId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/teams/{teamId}/status")
    public ResponseEntity<TeamDetailResponse> updateTeamStatus(
            @PathVariable Long teamId,
            @Valid @RequestBody UpdateTeamStatusRequest request) {
        TeamDetailResponse response = teamService.updateTeamStatus(teamId, request.getStatus());
        return ResponseEntity.ok(response);
    }

    private final com.technicalescaperoom.backend.service.admin.AdminDashboardService adminDashboardService;
    private final com.technicalescaperoom.backend.service.admin.AdminTeamResetService adminTeamResetService;
    private final com.technicalescaperoom.backend.service.PlayerSessionService playerSessionService;

    @GetMapping("/events/{eventId}/teams/progress")
    public ResponseEntity<List<AdminTeamProgressDto>> getTeamsProgress(
            @PathVariable Long eventId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) String status) {
        List<AdminTeamProgressDto> response = adminDashboardService.getTeamsProgress(eventId, search, level, status);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/teams/{teamId}/reset")
    public ResponseEntity<Void> resetTeam(
            @PathVariable Long teamId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        adminTeamResetService.resetTeamProgress(principal, teamId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/teams/{teamId}/pause")
    public ResponseEntity<TeamDetailResponse> pauseTeam(
            @PathVariable Long teamId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        TeamDetailResponse response = teamService.updateTeamStatus(teamId, com.technicalescaperoom.backend.enums.TeamStatus.REGISTERED);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/teams/{teamId}/resume")
    public ResponseEntity<TeamDetailResponse> resumeTeam(
            @PathVariable Long teamId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        TeamDetailResponse response = teamService.updateTeamStatus(teamId, com.technicalescaperoom.backend.enums.TeamStatus.REGISTERED);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sessions/{sessionId}/revoke")
    public ResponseEntity<Void> revokeSession(
            @PathVariable Long sessionId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        playerSessionService.revokeSession(principal, sessionId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/teams/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long teamId) {
        teamService.deleteTeam(teamId);
        return ResponseEntity.noContent().build();
    }

    // ---- Excel Team Import Endpoints ----

    @PostMapping("/events/{eventId}/teams/import/preview")
    public ResponseEntity<TeamImportPreviewDto> previewExcelImport(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file) {
        TeamImportPreviewDto preview = teamExcelImportService.parseAndValidate(eventId, file);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/events/{eventId}/teams/import/confirm")
    public ResponseEntity<TeamImportResultDto> confirmExcelImport(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        TeamImportResultDto result = teamExcelImportService.importTeams(eventId, file, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
