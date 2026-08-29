package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.entity.Hint;
import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.enums.AnswerType;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.HintRepository;
import com.technicalescaperoom.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminContentService {

    private final QuestionRepository questionRepository;
    private final HintRepository hintRepository;
    private final AdminAuditService adminAuditService;

    @Transactional
    public Question updateQuestion(AdminPrincipal principal, Long questionId, String questionContent, String expectedAnswerHash, AnswerType answerType, Boolean isActive) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found for ID " + questionId));

        if (questionContent != null && !questionContent.isBlank()) {
            question.setQuestionContent(questionContent);
        }
        if (expectedAnswerHash != null && !expectedAnswerHash.isBlank()) {
            question.setExpectedAnswerHash(expectedAnswerHash);
        }
        if (answerType != null) {
            question.setAnswerType(answerType);
        }
        if (isActive != null) {
            question.setIsActive(isActive);
        }

        Question saved = questionRepository.save(question);

        adminAuditService.logAction(
                principal,
                "UPDATE_QUESTION",
                "Question #" + questionId,
                "Updated question content for Level " + question.getLevel().getLevelNumber() + " Player " + question.getPlayerNumber()
        );

        log.info("Admin {} updated Question #{}", principal != null ? principal.getUsername() : "SYSTEM", questionId);
        return saved;
    }

    @Transactional
    public Hint updateHint(AdminPrincipal principal, Long hintId, String hintContent, Boolean isActive) {
        Hint hint = hintRepository.findById(hintId)
                .orElseThrow(() -> new ResourceNotFoundException("Hint not found for ID " + hintId));

        if (hintContent != null && !hintContent.isBlank()) {
            hint.setHintContent(hintContent);
        }
        if (isActive != null) {
            hint.setIsActive(isActive);
        }

        Hint saved = hintRepository.save(hint);

        adminAuditService.logAction(
                principal,
                "UPDATE_HINT",
                "Hint #" + hintId,
                "Updated hint content for Level " + hint.getLevel().getLevelNumber()
        );

        log.info("Admin {} updated Hint #{}", principal != null ? principal.getUsername() : "SYSTEM", hintId);
        return saved;
    }
}
