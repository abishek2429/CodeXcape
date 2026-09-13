package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.admin.AntiCheatEventAuditDto;
import com.technicalescaperoom.backend.dto.admin.AntiCheatSummaryDto;
import com.technicalescaperoom.backend.service.AntiCheatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/anti-cheat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ORGANIZER')")
public class AdminAntiCheatController {

    private final AntiCheatService antiCheatService;

    @GetMapping("/events")
    public ResponseEntity<List<AntiCheatEventAuditDto>> getEventViolations(@RequestParam Long eventId) {
        List<AntiCheatEventAuditDto> violations = antiCheatService.getEventViolations(eventId);
        return ResponseEntity.ok(violations);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<AntiCheatSummaryDto>> getEventSummaries(@RequestParam Long eventId) {
        List<AntiCheatSummaryDto> summaries = antiCheatService.getEventSummaries(eventId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<AntiCheatEventAuditDto>> getTeamViolations(@PathVariable Long teamId) {
        List<AntiCheatEventAuditDto> violations = antiCheatService.getTeamViolations(teamId);
        return ResponseEntity.ok(violations);
    }
}
