package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerHintsResponseDto;
import com.technicalescaperoom.backend.service.HintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/player/game")
@RequiredArgsConstructor
public class PlayerHintController {

    private final HintService hintService;

    @GetMapping("/hints")
    public ResponseEntity<PlayerHintsResponseDto> getPlayerHints(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerHintsResponseDto response = hintService.getHintsForPlayer(principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/hints/{levelNumber}/{stageNumber}/{hintNumber}")
    public ResponseEntity<com.technicalescaperoom.backend.dto.player.HintUseResponseDto> useHint(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @PathVariable Integer levelNumber,
            @PathVariable Integer stageNumber,
            @PathVariable Integer hintNumber) {
        return ResponseEntity.ok(hintService.useHint(principal, levelNumber, stageNumber, hintNumber));
    }
}
