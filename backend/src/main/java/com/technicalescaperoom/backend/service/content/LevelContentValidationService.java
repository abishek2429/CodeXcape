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
import java.util.TreeSet;

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
            if (q.getEvidence() == null || q.getEvidence().isBlank()) {
                throw new IncompleteLevelContentException("Question ID " + q.getId() + " evidence cannot be blank.");
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

        TreeSet<Integer> stageNumbers = questions.stream()
                .map(Question::getStageNumber)
                .collect(Collectors.toCollection(TreeSet::new));

        if (stageNumbers.isEmpty() || stageNumbers.size() > 3
                || !stageNumbers.equals(new TreeSet<>(java.util.stream.IntStream.rangeClosed(1, stageNumbers.size()).boxed().toList()))) {
            throw new IncompleteLevelContentException("Level " + level.getLevelNumber() + " must contain sequential active stages.");
        }

        for (Integer stageNumber : stageNumbers) {
            Map<QuestionPlayer, Long> countByPlayer = questions.stream()
                    .filter(question -> question.getStageNumber().equals(stageNumber))
                    .collect(Collectors.groupingBy(Question::getPlayerNumber, Collectors.counting()));

            if (!Long.valueOf(1).equals(countByPlayer.get(QuestionPlayer.PLAYER_1))
                    || !Long.valueOf(1).equals(countByPlayer.get(QuestionPlayer.PLAYER_2))) {
                throw new IncompleteLevelContentException("Level " + level.getLevelNumber() + ", Stage " + stageNumber + " must have exactly one artifact for each player.");
            }
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
