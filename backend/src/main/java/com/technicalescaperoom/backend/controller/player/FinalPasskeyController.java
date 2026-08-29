package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.FinalPasskeyResponseDto;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.service.FinalPasskeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player/game")
@RequiredArgsConstructor
public class FinalPasskeyController {

    private final FinalPasskeyService finalPasskeyService;

    @PostMapping("/final-passkey")
    public ResponseEntity<FinalPasskeyResponseDto> submitFinalPasskey(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @Valid @RequestBody FinalPasskeySubmissionRequest request
    ) {
        FinalPasskeyResponseDto response = finalPasskeyService.submitFinalPasskey(principal, request);
        return ResponseEntity.ok(response);
    }
}
