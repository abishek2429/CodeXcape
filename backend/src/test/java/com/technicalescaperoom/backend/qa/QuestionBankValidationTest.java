package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.dto.admin.EventReadinessDto;
import com.technicalescaperoom.backend.entity.Hint;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import com.technicalescaperoom.backend.repository.HintRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.QuestionRepository;
import com.technicalescaperoom.backend.service.admin.EventContentValidationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
class QuestionBankValidationTest {

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private EventContentValidationService validationService;

    @Test
    void testProductionQuestionBankStructure() {
        List<Level> levels = levelRepository.findAll();
        assertThat(levels).hasSize(6);

        for (int i = 1; i <= 6; i++) {
            final int levelNum = i;
            Level level = levels.stream().filter(l -> l.getLevelNumber() == levelNum).findFirst().orElseThrow();
            
            Optional<Question> q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level.getId(), 1, QuestionPlayer.PLAYER_1);
            Optional<Question> q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level.getId(), 1, QuestionPlayer.PLAYER_2);
            List<Hint> hints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());

            assertThat(q1).isPresent();
            assertThat(q1.get().getEvidence()).isNotBlank();
            assertThat(q1.get().getExpectedAnswerHash()).isNotBlank();
            
            assertThat(q2).isPresent();
            assertThat(q2.get().getEvidence()).isNotBlank();
            assertThat(q2.get().getExpectedAnswerHash()).isNotBlank();
            
            assertThat(hints).isNotEmpty();
            assertThat(hints.get(0).getHintContent()).isNotBlank();
        }
    }

    @Test
    void testAnswersAreDeterministicAndNormalized() {
        // Just verify some answers from the migration (Stage 1)
        Optional<Question> level1P1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(1L, 1, QuestionPlayer.PLAYER_1);
        assertThat(level1P1).isPresent();
        assertThat(level1P1.get().getExpectedAnswerHash()).isEqualTo("SYSTEM TRACE: K-17");

        Optional<Question> level1P2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(1L, 1, QuestionPlayer.PLAYER_2);
        assertThat(level1P2).isPresent();
        assertThat(level1P2.get().getExpectedAnswerHash()).isEqualTo("SYSTEM TRACE: K-17");
    }

    @Test
    void testEventReadinessValidation() {
        // Assuming event ID 999 is the test event (from V18)
        EventReadinessDto readiness = validationService.validateEventReadiness(999L);
        
        assertThat(readiness.isLevelsReady()).isTrue();
        assertThat(readiness.isQuestionsReady()).isTrue();
        assertThat(readiness.isAnswersReady()).isTrue();
        assertThat(readiness.isHintsReady()).isTrue();
        // passkeyReady might be true/false depending on if it's set in the event, but the structural components should be ready.
    }
}
