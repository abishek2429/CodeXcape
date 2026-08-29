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
public class Phase16ContentManagementAndValidationTest {

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
                .description("Phase 16 Validation Test")
                .status(EventStatus.DRAFT)
                .passkeyHash("") // Unconfigured empty passkey string for validation testing
                .createdAt(Instant.now())
                .build();
        testEvent = eventRepository.save(testEvent);
    }

    @Test
    @DisplayName("Phase 16 - Pre-Event Readiness Validation & Missing Content Reporting")
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
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), lvlNum, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1)
                    .questionContent("P1 Question Level " + lvlNum)
                    .expectedAnswer("ans1_" + lvlNum)
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), lvlNum, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2)
                    .questionContent("P2 Question Level " + lvlNum)
                    .expectedAnswer("ans2_" + lvlNum)
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveHintConfig(adminPrincipal, testEvent.getId(), lvlNum, HintConfigDto.builder()
                    .hintContent("Hint for Level " + lvlNum)
                    .displayOrder(1)
                    .build());
        }

        EventReadinessDto completeReadiness = eventContentValidationService.validateEventReadiness(testEvent.getId());
        assertThat(completeReadiness.isOverallReady()).isTrue();
        assertThat(completeReadiness.getValidationErrors()).isEmpty();
    }

    @Test
    @DisplayName("Phase 16 - Block Event Start if Mandatory Content Incomplete")
    void testBlockEventStartWhenIncomplete() {
        // Attempting to start event without passkey configured must fail
        assertThatThrownBy(() -> adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot start event");
    }

    @Test
    @DisplayName("Phase 16 - Organizer Answer Validation Simulator")
    void testAnswerTestSimulator() {
        adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("What is 2 + 2?")
                .expectedAnswer("4")
                .answerType(AnswerType.TEXT)
                .build());

        AnswerTestResponseDto correctResult = adminContentService.testAnswer(adminPrincipal, testEvent.getId(), AnswerTestRequestDto.builder()
                .levelNumber(1)
                .playerNumber(QuestionPlayer.PLAYER_1)
                .candidateAnswer(" 4 ")
                .build());
        assertThat(correctResult.getResult()).isEqualTo("CORRECT");

        AnswerTestResponseDto wrongResult = adminContentService.testAnswer(adminPrincipal, testEvent.getId(), AnswerTestRequestDto.builder()
                .levelNumber(1)
                .playerNumber(QuestionPlayer.PLAYER_1)
                .candidateAnswer(" 5 ")
                .build());
        assertThat(wrongResult.getResult()).isEqualTo("INCORRECT");
    }

    @Test
    @DisplayName("Phase 16 - Safe Player Preview Does Not Expose Expected Answers or Passkeys")
    void testSafePlayerPreview() {
        adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 2, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("Decrypt ciphertext X")
                .expectedAnswer("supersecretanswer")
                .answerType(AnswerType.TEXT)
                .build());

        adminContentService.saveHintConfig(adminPrincipal, testEvent.getId(), 2, HintConfigDto.builder()
                .hintContent("Look at ROT13")
                .build());

        PlayerSafePreviewDto preview = adminContentService.getPlayerSafePreview(testEvent.getId(), 2, 1);
        assertThat(preview.getQuestionContent()).isEqualTo("Decrypt ciphertext X");
        assertThat(preview.getHintContent()).isEqualTo("Look at ROT13");
    }

    @Test
    @DisplayName("Phase 16 - Content Lock Enforced When Event Is RUNNING")
    void testContentLockWhenRunning() {
        // Populate 6 levels and passkey
        adminEventControlService.updateEventPasskey(adminPrincipal, testEvent.getId(), "654321");
        for (int i = 1; i <= 6; i++) {
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), i, QuestionConfigDto.builder().playerNumber(QuestionPlayer.PLAYER_1).questionContent("Q1_" + i).expectedAnswer("A1_" + i).build());
            adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), i, QuestionConfigDto.builder().playerNumber(QuestionPlayer.PLAYER_2).questionContent("Q2_" + i).expectedAnswer("A2_" + i).build());
            adminContentService.saveHintConfig(adminPrincipal, testEvent.getId(), i, HintConfigDto.builder().hintContent("H_" + i).build());
        }

        // Start Event
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);

        // Attempting to edit content while RUNNING must throw IllegalStateException
        assertThatThrownBy(() -> adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("Modified Q1")
                .expectedAnswer("ModA")
                .build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Event content is locked");
    }
}
