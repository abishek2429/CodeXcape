package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.AntiCheatSummaryDto;
import com.technicalescaperoom.backend.dto.player.AntiCheatEventResponseDto;
import com.technicalescaperoom.backend.dto.player.AntiCheatReportRequest;
import com.technicalescaperoom.backend.service.AntiCheatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/player/anti-cheat")
@RequiredArgsConstructor
public class AntiCheatController {

    private final AntiCheatService antiCheatService;

    @PostMapping("/event")
    public ResponseEntity<AntiCheatEventResponseDto> reportEvent(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @Valid @RequestBody AntiCheatReportRequest request
    ) {
        AntiCheatEventResponseDto response = antiCheatService.processPlayerEvent(principal, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<AntiCheatSummaryDto> getTeamSummary(
            @AuthenticationPrincipal PlayerPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.notFound().build();
        }
        AntiCheatSummaryDto summary = antiCheatService.getTeamSummary(principal.getTeamId());
        return ResponseEntity.ok(summary);
    }
}
