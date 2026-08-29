package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.entity.Hint;
import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.enums.AnswerType;
import com.technicalescaperoom.backend.service.admin.AdminContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Long questionId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        String questionContent = (String) payload.get("questionContent");
        String expectedAnswerHash = (String) payload.get("expectedAnswerHash");
        String answerTypeStr = (String) payload.get("answerType");
        Boolean isActive = (Boolean) payload.get("isActive");

        AnswerType answerType = (answerTypeStr != null && !answerTypeStr.isBlank()) ? AnswerType.valueOf(answerTypeStr) : null;

        Question updated = adminContentService.updateQuestion(principal, questionId, questionContent, expectedAnswerHash, answerType, isActive);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/hints/{hintId}")
    public ResponseEntity<Hint> updateHint(
            @PathVariable Long hintId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        String hintContent = (String) payload.get("hintContent");
        Boolean isActive = (Boolean) payload.get("isActive");

        Hint updated = adminContentService.updateHint(principal, hintId, hintContent, isActive);
        return ResponseEntity.ok(updated);
    }
}
