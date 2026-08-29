package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.EventReadinessDto;
import com.technicalescaperoom.backend.dto.admin.LevelReadinessSummaryDto;
import com.technicalescaperoom.backend.entity.*;
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
public class EventContentValidationService {

    private final EventRepository eventRepository;
    private final LevelRepository levelRepository;
    private final QuestionRepository questionRepository;
    private final HintRepository hintRepository;

    @Transactional(readOnly = true)
    public EventReadinessDto validateEventReadiness(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<String> errors = new ArrayList<>();
        Map<Integer, LevelReadinessSummaryDto> levelSummaries = new HashMap<>();

        List<Level> levels = levelRepository.findAll();
        boolean levelsCountValid = (levels.size() >= 6);

        if (!levelsCountValid) {
            errors.add("Event configuration requires exactly 6 levels (found: " + levels.size() + ").");
        }

        boolean allQuestionsOk = true;
        boolean allAnswersOk = true;
        boolean allHintsOk = true;

        for (int i = 1; i <= 6; i++) {
            final int levelNum = i;
            Level level = levels.stream()
                    .filter(l -> l.getLevelNumber() == levelNum)
                    .findFirst()
                    .orElse(null);

            if (level == null) {
                errors.add("Level " + levelNum + " is missing from event configuration.");
                allQuestionsOk = false;
                allAnswersOk = false;
                allHintsOk = false;
                levelSummaries.put(levelNum, LevelReadinessSummaryDto.builder()
                        .levelNumber(levelNum)
                        .levelName("Level " + levelNum)
                        .player1QuestionConfigured(false)
                        .player2QuestionConfigured(false)
                        .player1AnswerConfigured(false)
                        .player2AnswerConfigured(false)
                        .hintConfigured(false)
                        .levelReady(false)
                        .build());
                continue;
            }

            Optional<Question> q1Opt = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_1);
            Optional<Question> q2Opt = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_2);
            List<Hint> hints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());

            boolean p1Q = q1Opt.isPresent() && q1Opt.get().getQuestionContent() != null && !q1Opt.get().getQuestionContent().isBlank();
            boolean p2Q = q2Opt.isPresent() && q2Opt.get().getQuestionContent() != null && !q2Opt.get().getQuestionContent().isBlank();

            boolean p1A = q1Opt.isPresent() && q1Opt.get().getExpectedAnswerHash() != null && !q1Opt.get().getExpectedAnswerHash().isBlank();
            boolean p2A = q2Opt.isPresent() && q2Opt.get().getExpectedAnswerHash() != null && !q2Opt.get().getExpectedAnswerHash().isBlank();

            boolean hintOk = hints.stream().anyMatch(h -> Boolean.TRUE.equals(h.getIsActive()) && h.getHintContent() != null && !h.getHintContent().isBlank());

            if (!p1Q) {
                errors.add("Level " + levelNum + ": Player 1 question is missing or empty.");
                allQuestionsOk = false;
            }
            if (!p2Q) {
                errors.add("Level " + levelNum + ": Player 2 question is missing or empty.");
                allQuestionsOk = false;
            }
            if (!p1A) {
                errors.add("Level " + levelNum + ": Player 1 expected answer is missing.");
                allAnswersOk = false;
            }
            if (!p2A) {
                errors.add("Level " + levelNum + ": Player 2 expected answer is missing.");
                allAnswersOk = false;
            }
            if (!hintOk) {
                errors.add("Level " + levelNum + ": Progressive hint is missing or empty.");
                allHintsOk = false;
            }

            boolean levelReady = p1Q && p2Q && p1A && p2A && hintOk;
            levelSummaries.put(levelNum, LevelReadinessSummaryDto.builder()
                    .levelNumber(levelNum)
                    .levelName(level.getName())
                    .player1QuestionConfigured(p1Q)
                    .player2QuestionConfigured(p2Q)
                    .player1AnswerConfigured(p1A)
                    .player2AnswerConfigured(p2A)
                    .hintConfigured(hintOk)
                    .levelReady(levelReady)
                    .build());
        }

        // Final Passkey validation
        boolean passkeyConfigured = event.getPasskeyHash() != null && !event.getPasskeyHash().isBlank();
        if (!passkeyConfigured) {
            errors.add("Final Terminal configuration: Secret 6-digit passkey hash is missing.");
        }

        boolean overallReady = levelsCountValid && allQuestionsOk && allAnswersOk && allHintsOk && passkeyConfigured;

        log.info("Event #{} validation complete. Overall status: {}. Errors: {}", eventId, overallReady ? "READY" : "NOT_READY", errors.size());

        return EventReadinessDto.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .eventStatus(event.getStatus().name())
                .overallReady(overallReady)
                .levelsReady(levelsCountValid)
                .questionsReady(allQuestionsOk)
                .answersReady(allAnswersOk)
                .hintsReady(allHintsOk)
                .passkeyReady(passkeyConfigured)
                .validationErrors(errors)
                .levelSummaries(levelSummaries)
                .build();
    }
}
