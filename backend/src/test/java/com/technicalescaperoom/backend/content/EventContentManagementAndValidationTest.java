package com.technicalescaperoom.backend.content;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.admin.AdminContentService;
import com.technicalescaperoom.backend.service.admin.AdminEventControlService;
import com.technicalescaperoom.backend.service.admin.EventContentValidationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class EventContentManagementAndValidationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private EventContentValidationService eventContentValidationService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event testEvent;
    private AdminPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("admin_content_test", UserRole.ORGANIZER);

        testEvent = Event.builder()
                .name("CodeXcape 2026 Content Test")
                .description("Validation Test")
                .status(EventStatus.DRAFT)
                .passkeyHash("") // Unconfigured empty passkey string for validation testing
                .createdAt(Instant.now())
                .build();
        testEvent = eventRepository.save(testEvent);
    }

    @Test
    @DisplayName("Pre-Event Readiness Validation & Missing Content Reporting")
    void testPreEventReadinessValidation() {
        // Initial state (missing passkey)
        EventReadinessDto initialReadiness = eventContentValidationService.validateEventReadiness(testEvent.getId());
        assertThat(initialReadiness.isOverallReady()).isFalse();
        assertThat(initialReadiness.getValidationErrors()).isNotEmpty();

        // Configure passkey
        adminEventControlService.updateEventPasskey(adminPrincipal, testEvent.getId(), "654321");

        // Populate all 6 levels
        for (int i = 1; i <= 6; i++) {
            final int lvlNum = i;

            // Save Question P1
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), lvlNum, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1)
                    .questionContent("Question for Level " + lvlNum + " P1")
                    .expectedAnswer("ans_l" + lvlNum + "_p1")
                    .answerType(AnswerType.TEXT)
                    .build());

            // Save Question P2
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), lvlNum, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2)
                    .questionContent("Question for Level " + lvlNum + " P2")
                    .expectedAnswer("ans_l" + lvlNum + "_p2")
                    .answerType(AnswerType.TEXT)
                    .build());

            // Save Hint
            adminContentService.saveHintConfig(adminPrincipal, testEvent.getId(), lvlNum, HintConfigDto.builder()
                    .hintContent("Hint for Level " + lvlNum)
                    .displayOrder(1)
                    .build());
        }

        // Re-validate
        EventReadinessDto finalReadiness = eventContentValidationService.validateEventReadiness(testEvent.getId());
        assertThat(finalReadiness.isOverallReady()).isTrue();
        assertThat(finalReadiness.getValidationErrors()).isEmpty();
        assertThat(finalReadiness.getLevelSummaries()).hasSize(6);
    }

    @Test
    @DisplayName("Organizer Answer Test Simulator")
    void testAnswerTestSimulator() {
        // Create question
        adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("What is 2 + 2?")
                .expectedAnswer("4")
                .answerType(AnswerType.TEXT)
                .build());

        // Correct answer
        AnswerTestResponseDto correctRes = adminContentService.testAnswer(adminPrincipal, testEvent.getId(), AnswerTestRequestDto.builder()
                .levelNumber(1)
                .playerNumber(QuestionPlayer.PLAYER_1)
                .candidateAnswer("4")
                .build());
        assertThat(correctRes.getResult()).isEqualTo("CORRECT");

        // Incorrect answer
        AnswerTestResponseDto wrongRes = adminContentService.testAnswer(adminPrincipal, testEvent.getId(), AnswerTestRequestDto.builder()
                .levelNumber(1)
                .playerNumber(QuestionPlayer.PLAYER_1)
                .candidateAnswer("5")
                .build());
        assertThat(wrongRes.getResult()).isEqualTo("INCORRECT");
    }

    @Test
    @DisplayName("Safe Player Preview (Omit Expected Answers & Hashes)")
    void testSafePlayerPreview() {
        adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("Secret Question")
                .expectedAnswer("TopSecretAnswer")
                .answerType(AnswerType.TEXT)
                .build());

        PlayerSafePreviewDto preview = adminContentService.getPlayerSafePreview(testEvent.getId(), 1, 1);

        assertThat(preview.getQuestionContent()).isEqualTo("Secret Question");
        // Verify response contains NO answer leak
        assertThat(preview.toString()).doesNotContain("TopSecretAnswer");
    }

    @Test
    @DisplayName("Content Lock Enforcement When Event is RUNNING or COMPLETED")
    void testContentLockWhenRunning() {
        // Fully configure event and passkey
        adminEventControlService.updateEventPasskey(adminPrincipal, testEvent.getId(), "123456");

        for (int i = 1; i <= 6; i++) {
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1).questionContent("Q1").expectedAnswer("A1").build());
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2).questionContent("Q2").expectedAnswer("A2").build());
            adminContentService.saveHintConfig(adminPrincipal, testEvent.getId(), i, HintConfigDto.builder()
                    .hintContent("H").displayOrder(1).build());
        }

        // Change status to RUNNING
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);

        // Attempting to modify question while running throws IllegalStateException
        assertThatThrownBy(() -> adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("New Content")
                .expectedAnswer("New Answer")
                .build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Event content is locked");
    }
}
