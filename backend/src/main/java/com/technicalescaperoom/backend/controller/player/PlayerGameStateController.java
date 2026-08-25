package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.CurrentLevelDto;
import com.technicalescaperoom.backend.dto.player.PlayerGameStateDto;
import com.technicalescaperoom.backend.service.GameStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player/game")
@RequiredArgsConstructor
public class PlayerGameStateController {

    private final GameStateService gameStateService;

    @GetMapping
    public ResponseEntity<PlayerGameStateDto> getPlayerGameState(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerGameStateDto gameState = gameStateService.getGameStateForPlayer(principal);
        return ResponseEntity.ok(gameState);
    }

    @GetMapping("/current")
    public ResponseEntity<CurrentLevelDto> getCurrentLevel(@AuthenticationPrincipal PlayerPrincipal principal) {
        CurrentLevelDto currentLevel = gameStateService.getCurrentLevelForPlayer(principal);
        return ResponseEntity.ok(currentLevel);
    }
}
