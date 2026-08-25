package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminTeamController {

    private final TeamService teamService;

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

    @DeleteMapping("/teams/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long teamId) {
        teamService.deleteTeam(teamId);
        return ResponseEntity.noContent().build();
    }
}
