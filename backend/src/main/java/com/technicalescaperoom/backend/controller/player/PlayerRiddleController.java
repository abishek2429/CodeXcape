package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.RiddleDto.RiddleBoardStateResponseDto;
import com.technicalescaperoom.backend.dto.player.RiddleDto.RiddleSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.RiddleDto.RiddleSubmissionResponseDto;
import com.technicalescaperoom.backend.service.RiddleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/player/riddles")
@RequiredArgsConstructor
public class PlayerRiddleController {

    private final RiddleService riddleService;

    @GetMapping
    public ResponseEntity<RiddleBoardStateResponseDto> getRiddleBoardState(
            @AuthenticationPrincipal PlayerPrincipal principal
    ) {
        RiddleBoardStateResponseDto response = riddleService.getRiddleBoardState(principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    public ResponseEntity<RiddleSubmissionResponseDto> submitRiddleAnswer(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @Valid @RequestBody RiddleSubmissionRequest request
    ) {
        RiddleSubmissionResponseDto response = riddleService.submitRiddleAnswer(principal, request);
        return ResponseEntity.ok(response);
    }
}
