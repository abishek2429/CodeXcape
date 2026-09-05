package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminContentService {

    private final EventRepository eventRepository;
    private final LevelRepository levelRepository;
    private final QuestionRepository questionRepository;
    private final HintRepository hintRepository;
    private final AdminAuditService adminAuditService;
    private final EventContentValidationService eventContentValidationService;

    @Transactional
    public QuestionConfigDto saveQuestionConfig(AdminPrincipal principal, Long eventId, Integer levelNumber, QuestionConfigDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        validateContentEditable(event);

        Level level = levelRepository.findByLevelNumber(levelNumber)
                .orElseGet(() -> levelRepository.save(Level.builder()
                        .levelNumber(levelNumber)
                        .name("Level " + levelNumber)
                        .description("Level " + levelNumber + " challenge")
                        .isActive(true)
                        .build()));

        QuestionPlayer playerRole = dto.getPlayerNumber();
        Question question = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level.getId(), dto.getStageNumber(), playerRole)
                .orElseGet(() -> Question.builder()
                        .level(level)
                        .stageNumber(dto.getStageNumber())
                        .playerNumber(playerRole)
                        .isActive(true)
                        .build());

        question.setEvidence(dto.getEvidence().trim());
        question.setInstructions(dto.getInstructions() != null ? dto.getInstructions().trim() : null);
        question.setPuzzleContext(dto.getPuzzleContext() != null ? dto.getPuzzleContext().trim() : null);
        question.setTechnicalCategory(dto.getTechnicalCategory() != null ? dto.getTechnicalCategory().trim() : null);
        question.setDifficulty(dto.getDifficulty() != null ? dto.getDifficulty().trim() : null);
        question.setValidationRules(dto.getValidationRules() != null ? dto.getValidationRules().trim() : null);
        question.setPuzzleMetadata(dto.getPuzzleMetadata() != null ? dto.getPuzzleMetadata().trim() : null);
        question.setExpectedAnswerHash(dto.getExpectedAnswer().trim());
        if (dto.getAnswerType() != null) {
            question.setAnswerType(dto.getAnswerType());
        }

        Question saved = questionRepository.save(question);

        adminAuditService.logAction(
                principal,
                "EDIT_QUESTION",
                "Level " + levelNumber + " (" + playerRole + ")",
                "Updated question content and expected answer"
        );

        log.info("Admin {} updated Question for Level {} Player {}", principal != null ? principal.getUsername() : "SYSTEM", levelNumber, playerRole);

        return QuestionConfigDto.builder()
                .id(saved.getId())
                .levelNumber(levelNumber)
                .stageNumber(saved.getStageNumber())
                .playerNumber(saved.getPlayerNumber())
                .evidence(saved.getEvidence())
                .instructions(saved.getInstructions())
                .technicalCategory(saved.getTechnicalCategory())
                .difficulty(saved.getDifficulty())
                .validationRules(saved.getValidationRules())
                .puzzleMetadata(saved.getPuzzleMetadata())
                .puzzleContext(saved.getPuzzleContext())
                .expectedAnswer(saved.getExpectedAnswerHash())
                .answerType(saved.getAnswerType())
                .isActive(saved.getIsActive())
                .interdependentConfirmed(true)
                .build();
    }

    @Transactional
    public HintConfigDto saveHintConfig(AdminPrincipal principal, Long eventId, Integer levelNumber, HintConfigDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        validateContentEditable(event);

        Level level = levelRepository.findByLevelNumber(levelNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Level " + levelNumber + " not found."));

        List<Hint> existingHints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());
        Hint hint = existingHints.isEmpty() ? Hint.builder().level(level).displayOrder(1).isActive(true).build() : existingHints.get(0);

        hint.setHintContent(dto.getHintContent().trim());
        Hint saved = hintRepository.save(hint);

        adminAuditService.logAction(
                principal,
                "EDIT_HINT",
                "Level " + levelNumber,
                "Updated progressive hint content"
        );

        log.info("Admin {} updated Hint for Level {}", principal != null ? principal.getUsername() : "SYSTEM", levelNumber);

        return HintConfigDto.builder()
                .id(saved.getId())
                .levelNumber(levelNumber)
                .hintContent(saved.getHintContent())
                .displayOrder(saved.getDisplayOrder())
                .isActive(saved.getIsActive())
                .build();
    }

    @Transactional(readOnly = true)
    public AnswerTestResponseDto testAnswer(AdminPrincipal principal, Long eventId, AnswerTestRequestDto request) {
        Level level = levelRepository.findByLevelNumber(request.getLevelNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Level " + request.getLevelNumber() + " not found."));

        Question question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), request.getPlayerNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + request.getLevelNumber() + " Player " + request.getPlayerNumber()));

        String submitted = request.getCandidateAnswer() != null ? request.getCandidateAnswer().trim() : "";
        String expected = question.getExpectedAnswerHash() != null ? question.getExpectedAnswerHash().trim() : "";

        boolean matches = submitted.equalsIgnoreCase(expected);

        adminAuditService.logAction(
                principal,
                "TEST_ANSWER_PREVIEW",
                "Level " + request.getLevelNumber() + " (" + request.getPlayerNumber() + ")",
                "Tested answer candidate (Result: " + (matches ? "CORRECT" : "INCORRECT") + ")"
        );

        return AnswerTestResponseDto.builder()
                .levelNumber(request.getLevelNumber())
                .playerNumber(request.getPlayerNumber().name())
                .result(matches ? "CORRECT" : "INCORRECT")
                .build();
    }

    @Transactional(readOnly = true)
    public PlayerSafePreviewDto getPlayerSafePreview(Long eventId, Integer levelNumber, Integer playerNumber) {
        Level level = levelRepository.findByLevelNumber(levelNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Level " + levelNumber + " not found."));

        QuestionPlayer playerRole = (playerNumber == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;
        Question question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), playerRole)
                .orElse(null);

        List<Hint> hints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());
        String hintContent = hints.isEmpty() ? "No hint configured." : hints.get(0).getHintContent();

        return PlayerSafePreviewDto.builder()
                .levelNumber(levelNumber)
                .levelName(level.getName())
                .playerNumber(playerNumber)
                .evidence(question != null ? question.getEvidence() : "No evidence configured for Player " + playerNumber)
                .instructions(question != null ? question.getInstructions() : "No instructions configured.")
                .puzzleContext(question != null ? question.getPuzzleContext() : null)
                .hintContent(hintContent)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllContentForEvent(Long eventId) {
        EventReadinessDto readiness = eventContentValidationService.validateEventReadiness(eventId);
        List<Level> levels = levelRepository.findAll();
        List<Map<String, Object>> levelDetails = new ArrayList<>();

        for (int i = 1; i <= 6; i++) {
            final int lvlNum = i;
            Level level = levels.stream().filter(l -> l.getLevelNumber() == lvlNum).findFirst().orElse(null);
            Map<String, Object> lvlMap = new HashMap<>();
            lvlMap.put("levelNumber", lvlNum);
            lvlMap.put("levelName", level != null ? level.getName() : "Level " + lvlNum);

            if (level != null) {
                Optional<Question> q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_1);
                Optional<Question> q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_2);
                List<Hint> hints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());

                lvlMap.put("player1Evidence", q1.map(Question::getEvidence).orElse(""));
                lvlMap.put("player1Instructions", q1.map(Question::getInstructions).orElse(""));
                lvlMap.put("player1Answer", q1.map(Question::getExpectedAnswerHash).orElse(""));
                lvlMap.put("player1PuzzleContext", q1.map(Question::getPuzzleContext).orElse(""));

                lvlMap.put("player2Evidence", q2.map(Question::getEvidence).orElse(""));
                lvlMap.put("player2Instructions", q2.map(Question::getInstructions).orElse(""));
                lvlMap.put("player2Answer", q2.map(Question::getExpectedAnswerHash).orElse(""));
                lvlMap.put("player2PuzzleContext", q2.map(Question::getPuzzleContext).orElse(""));

                lvlMap.put("hint", hints.isEmpty() ? "" : hints.get(0).getHintContent());
            } else {
                lvlMap.put("player1Evidence", "");
                lvlMap.put("player1Instructions", "");
                lvlMap.put("player1Answer", "");
                lvlMap.put("player2Evidence", "");
                lvlMap.put("player2Instructions", "");
                lvlMap.put("player2Answer", "");
                lvlMap.put("hint", "");
            }

            levelDetails.add(lvlMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("readiness", readiness);
        response.put("levels", levelDetails);
        return response;
    }

    @Transactional
    public Question updateQuestion(AdminPrincipal principal, Long questionId, String content, String expectedAnswer, com.technicalescaperoom.backend.enums.AnswerType answerType, boolean isActive) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found for ID " + questionId));
        question.setEvidence(content);
        question.setExpectedAnswerHash(expectedAnswer);
        if (answerType != null) question.setAnswerType(answerType);
        question.setIsActive(isActive);
        adminAuditService.logAction(principal, "EDIT_QUESTION", "Question #" + questionId, "Updated question content");
        return questionRepository.save(question);
    }

    @Transactional
    public Hint updateHint(AdminPrincipal principal, Long hintId, String content, boolean isActive) {
        Hint hint = hintRepository.findById(hintId)
                .orElseThrow(() -> new ResourceNotFoundException("Hint not found for ID " + hintId));
        hint.setHintContent(content);
        hint.setIsActive(isActive);
        adminAuditService.logAction(principal, "EDIT_HINT", "Hint #" + hintId, "Updated hint content");
        return hintRepository.save(hint);
    }

    private void validateContentEditable(Event event) {
        if (event != null && (event.getStatus() == EventStatus.RUNNING || event.getStatus() == EventStatus.COMPLETED)) {
            throw new IllegalStateException("Event content is locked because the event is currently " + event.getStatus() + ".");
        }
    }
}
