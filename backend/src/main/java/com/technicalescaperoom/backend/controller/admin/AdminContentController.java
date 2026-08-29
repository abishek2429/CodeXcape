package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.service.admin.AdminContentService;
import com.technicalescaperoom.backend.service.admin.EventContentValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;
    private final EventContentValidationService eventContentValidationService;

    @GetMapping("/{eventId}/content")
    public ResponseEntity<Map<String, Object>> getAllContent(@PathVariable Long eventId) {
        Map<String, Object> content = adminContentService.getAllContentForEvent(eventId);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/{eventId}/validation")
    public ResponseEntity<EventReadinessDto> validateEventReadiness(@PathVariable Long eventId) {
        EventReadinessDto readiness = eventContentValidationService.validateEventReadiness(eventId);
        return ResponseEntity.ok(readiness);
    }

    @PutMapping("/{eventId}/levels/{levelNumber}/questions")
    public ResponseEntity<QuestionConfigDto> saveQuestion(
            @PathVariable Long eventId,
            @PathVariable Integer levelNumber,
            @Valid @RequestBody QuestionConfigDto dto,
            @AuthenticationPrincipal AdminPrincipal principal) {
        QuestionConfigDto response = adminContentService.saveQuestionConfig(principal, eventId, levelNumber, dto);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{eventId}/levels/{levelNumber}/hint")
    public ResponseEntity<HintConfigDto> saveHint(
            @PathVariable Long eventId,
            @PathVariable Integer levelNumber,
            @Valid @RequestBody HintConfigDto dto,
            @AuthenticationPrincipal AdminPrincipal principal) {
        HintConfigDto response = adminContentService.saveHintConfig(principal, eventId, levelNumber, dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/test-answer")
    public ResponseEntity<AnswerTestResponseDto> testAnswer(
            @PathVariable Long eventId,
            @Valid @RequestBody AnswerTestRequestDto request,
            @AuthenticationPrincipal AdminPrincipal principal) {
        AnswerTestResponseDto response = adminContentService.testAnswer(principal, eventId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}/preview/player")
    public ResponseEntity<PlayerSafePreviewDto> getPlayerSafePreview(
            @PathVariable Long eventId,
            @RequestParam Integer levelNumber,
            @RequestParam Integer playerNumber) {
        PlayerSafePreviewDto preview = adminContentService.getPlayerSafePreview(eventId, levelNumber, playerNumber);
        return ResponseEntity.ok(preview);
    }
}
