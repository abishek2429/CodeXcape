package com.technicalescaperoom.backend.service.content;

import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import com.technicalescaperoom.backend.exception.IncompleteLevelContentException;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LevelContentValidationService {

    private final LevelRepository levelRepository;
    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public void validateLevelContent(Level level) {
        if (level == null) {
            throw new IncompleteLevelContentException("Level cannot be null.");
        }

        if (!Boolean.TRUE.equals(level.getIsActive())) {
            throw new IncompleteLevelContentException("Level " + level.getLevelNumber() + " is inactive.");
        }

        List<Question> questions = questionRepository.findByLevelIdAndIsActiveTrue(level.getId());

        // Validate individual question integrity
        for (Question q : questions) {
            if (q.getQuestionContent() == null || q.getQuestionContent().isBlank()) {
                throw new IncompleteLevelContentException("Question ID " + q.getId() + " content cannot be blank.");
            }
            if (q.getExpectedAnswerHash() == null || q.getExpectedAnswerHash().isBlank()) {
                throw new IncompleteLevelContentException("Question ID " + q.getId() + " expected answer hash cannot be blank.");
            }
            if (q.getPlayerNumber() == null) {
                throw new IncompleteLevelContentException("Question ID " + q.getId() + " must have a valid player number.");
            }
            if (q.getAnswerType() == null) {
                throw new IncompleteLevelContentException("Question ID " + q.getId() + " must have a valid answer type.");
            }
        }

        // Group by player number
        Map<QuestionPlayer, List<Question>> questionsByPlayer = questions.stream()
                .collect(Collectors.groupingBy(Question::getPlayerNumber));

        List<Question> p1Questions = questionsByPlayer.getOrDefault(QuestionPlayer.PLAYER_1, List.of());
        List<Question> p2Questions = questionsByPlayer.getOrDefault(QuestionPlayer.PLAYER_2, List.of());

        if (p1Questions.size() != 1) {
            throw new IncompleteLevelContentException("Level " + level.getLevelNumber() + " must have exactly 1 active Player 1 question, but found " + p1Questions.size());
        }

        if (p2Questions.size() != 1) {
            throw new IncompleteLevelContentException("Level " + level.getLevelNumber() + " must have exactly 1 active Player 2 question, but found " + p2Questions.size());
        }
    }

    @Transactional(readOnly = true)
    public void validateAllActiveLevelsContent() {
        List<Level> activeLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        if (activeLevels.isEmpty()) {
            throw new IncompleteLevelContentException("No active game levels configured in the system.");
        }
        for (Level level : activeLevels) {
            validateLevelContent(level);
        }
        log.info("Successfully validated content integrity for all {} active game levels.", activeLevels.size());
    }
}
