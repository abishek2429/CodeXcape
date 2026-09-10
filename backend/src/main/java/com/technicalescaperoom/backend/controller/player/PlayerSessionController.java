package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerLoginRequest;
import com.technicalescaperoom.backend.dto.player.PlayerResponseDto;
import com.technicalescaperoom.backend.service.PlayerSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/player")
@RequiredArgsConstructor
public class PlayerSessionController {

    private final PlayerSessionService playerSessionService;

    @PostMapping("/login")
    public ResponseEntity<PlayerResponseDto> login(
            @Valid @RequestBody PlayerLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        PlayerResponseDto playerResponse = playerSessionService.login(request, httpRequest, response);
        return ResponseEntity.ok(playerResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<PlayerResponseDto> getCurrentPlayer(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerResponseDto playerResponse = playerSessionService.getCurrentPlayer(principal);
        return ResponseEntity.ok(playerResponse);
    }

    @GetMapping("/lobby")
    public ResponseEntity<PlayerResponseDto> getLobbyState(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerResponseDto lobbyState = playerSessionService.getLobbyState(principal);
        return ResponseEntity.ok(lobbyState);
    }

    @PostMapping("/ready")
    public ResponseEntity<PlayerResponseDto> setReady(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @RequestBody(required = false) Map<String, Boolean> body
    ) {
        boolean isReady = body == null || body.get("ready") == null || Boolean.TRUE.equals(body.get("ready"));
        PlayerResponseDto updated = playerSessionService.setPlayerReady(principal, isReady);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/event/start")
    public ResponseEntity<PlayerResponseDto> startEvent(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerResponseDto response = playerSessionService.startTeamEvent(principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal PlayerPrincipal principal,
            HttpServletResponse response
    ) {
        playerSessionService.logout(principal, response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
