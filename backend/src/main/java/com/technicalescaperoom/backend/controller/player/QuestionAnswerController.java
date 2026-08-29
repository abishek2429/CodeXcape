package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/player/game/current")
@RequiredArgsConstructor
public class QuestionAnswerController {

    private final QuestionAnswerService questionAnswerService;

    @GetMapping("/question")
    public ResponseEntity<PlayerQuestionDto> getCurrentQuestion(@AuthenticationPrincipal PlayerPrincipal principal) {
        PlayerQuestionDto questionDto = questionAnswerService.getCurrentQuestionForPlayer(principal);
        return ResponseEntity.ok(questionDto);
    }

    @PostMapping("/answer")
    public ResponseEntity<AnswerSubmissionResponseDto> submitAnswer(
            @AuthenticationPrincipal PlayerPrincipal principal,
            @Valid @RequestBody AnswerSubmissionRequest request
    ) {
        AnswerSubmissionResponseDto response = questionAnswerService.submitAnswer(principal, request);
        return ResponseEntity.ok(response);
    }
}
