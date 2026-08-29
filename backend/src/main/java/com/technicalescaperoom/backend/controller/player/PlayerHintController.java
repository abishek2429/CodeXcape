package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerHintsResponseDto;
import com.technicalescaperoom.backend.service.HintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
