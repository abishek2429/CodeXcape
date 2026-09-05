package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.*;

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

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class CompleteSystemValidationAndE2ETest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private EventContentValidationService eventContentValidationService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private ResultExportService resultExportService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("qa_lead_admin", UserRole.ADMIN);
    }

    @Test
    @DisplayName("Complete E2E Scenario: Creation → Validation → 6-Level Gameplay → Passkey → Completion → Export")
    void testFullEventLifecycleE2E() {
        // 1. Create Event in DRAFT
        Event event = eventRepository.save(Event.builder()
                .name("CodeXcape E2E Event")
                .description("Automated E2E QA Test")
                .status(EventStatus.DRAFT)
                .passkeyHash("") // Unconfigured initially
                .createdAt(Instant.now())
                .build());

        // 2. Pre-Flight Check should report NOT READY
        EventReadinessDto initialReadiness = eventContentValidationService.validateEventReadiness(event.getId());
        assertThat(initialReadiness.isOverallReady()).isFalse();

        // 3. Configure Passkey & 6 Levels of Questions and Hints
        adminEventControlService.updateEventPasskey(adminPrincipal, event.getId(), "987654");

        for (int i = 1; i <= 6; i++) {
            adminContentService.saveQuestionConfig(adminPrincipal, event.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1)
                    .evidence("E2E L" + i + " P1 Question")
                    .expectedAnswer("e2e_p1_ans_" + i)
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveQuestionConfig(adminPrincipal, event.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2)
                    .evidence("E2E L" + i + " P2 Question")
                    .expectedAnswer("e2e_p2_ans_" + i)
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveHintConfig(adminPrincipal, event.getId(), i, HintConfigDto.builder()
                    .hintContent("E2E Progressive Hint Level " + i)
                    .displayOrder(1)
                    .build());
        }

        // 4. Pre-Flight Check should now report READY
        EventReadinessDto readyCheck = eventContentValidationService.validateEventReadiness(event.getId());
        assertThat(readyCheck.isOverallReady()).isTrue();

        // 5. Start Event
        adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING);

        // 6. Register Team & Players
        TeamDetailResponse regRes = teamService.createTeam(event.getId(), CreateTeamRequest.builder()
                .teamName("QA E2E Alpha Team")
                .player1DisplayName("Alice E2E")
                .player2DisplayName("Bob E2E")
                .build());

        Team team = teamRepository.findById(regRes.getId()).orElseThrow();
        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 1).orElseThrow();
        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 2).orElseThrow();

        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(1)
                .sessionToken("token_p1_e2e")
                .build();

        PlayerPrincipal p2Princ = PlayerPrincipal.builder()
                .playerId(p2.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(2)
                .sessionToken("token_p2_e2e")
                .build();

        // 7. Execute Gameplay Level 1 to 6
        for (int lvl = 1; lvl <= 6; lvl++) {
            // P1 gets assigned question and submits answer
            PlayerQuestionDto p1Q = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
            assertThat(p1Q.getLevelNumber()).isEqualTo(lvl);

            AnswerSubmissionResponseDto p1Ans = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                    .levelNumber(lvl)
                    .answer("e2e_p1_ans_" + lvl)
                    .build());
            assertThat(p1Ans.getCorrect()).isTrue();

            // P2 gets assigned question and submits answer
            PlayerQuestionDto p2Q = questionAnswerService.getCurrentQuestionForPlayer(p2Princ);
            assertThat(p2Q.getLevelNumber()).isEqualTo(lvl);

            AnswerSubmissionResponseDto p2Ans = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder()
                    .levelNumber(lvl)
                    .answer("e2e_p2_ans_" + lvl)
                    .build());
            assertThat(p2Ans.getCorrect()).isTrue();
        }

        // 8. Submit Incorrect Passkey
        FinalPasskeyResponseDto wrongPasskey = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder()
                .passkey("111111")
                .build());
        assertThat(wrongPasskey.getStatus()).isEqualTo("INCORRECT");

        // 9. Submit Correct 6-Digit Passkey
        FinalPasskeyResponseDto correctPasskey = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder()
                .passkey("987654")
                .build());
        assertThat(correctPasskey.getStatus()).isEqualTo("COMPLETED");

        // 10. Verify Leaderboard & Export
        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(event.getId());
        assertThat(stats.getCompletedTeams()).isEqualTo(1);

        String resultsCsv = resultExportService.generateEventResultsCsv(adminPrincipal, event.getId());
        assertThat(resultsCsv).contains("QA E2E Alpha Team");
        assertThat(resultsCsv).contains("COMPLETED");
        // Ensure secret passkey is NEVER in exported CSV
        assertThat(resultsCsv).doesNotContain("987654");
    }

    @Test
    @DisplayName("Cooperative Question Combinations (Correct & Incorrect Matrix)")
    void testCooperativeQuestionCombinations() {
        Event event = eventRepository.save(Event.builder()
                .name("Coop Question Matrix Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());

        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        TeamDetailResponse regRes = teamService.createTeam(event.getId(), CreateTeamRequest.builder()
                .teamName("Coop Matrix Team")
                .player1DisplayName("Player 1")
                .player2DisplayName("Player 2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 2).orElseThrow();

        PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(event.getId()).playerNumber(1).sessionToken("p1_mat_token").build();
        PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(regRes.getId()).eventId(event.getId()).playerNumber(2).sessionToken("p2_mat_token").build();

        // P1 incorrect
        AnswerSubmissionResponseDto p1Wrong = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer("wrong_ans").build());
        assertThat(p1Wrong.getCorrect()).isFalse();

        // P1 correct
        AnswerSubmissionResponseDto p1Right = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertThat(p1Right.getCorrect()).isTrue();

        // P2 incorrect
        AnswerSubmissionResponseDto p2Wrong = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer("wrong_ans").build());
        assertThat(p2Wrong.getCorrect()).isFalse();

        // P2 correct (completes Level 1)
        AnswerSubmissionResponseDto p2Right = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer(q2.getExpectedAnswerHash()).build());
        assertThat(p2Right.getCorrect()).isTrue();
        assertThat(p2Right.getIsCompleted()).isTrue();
    }

    @Test
    @DisplayName("Completion Idempotency & Repeat Submissions")
    void testCompletionIdempotency() {
        Event event = eventRepository.save(Event.builder()
                .name("Idempotency Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());

        TeamDetailResponse regRes = teamService.createTeam(event.getId(), CreateTeamRequest.builder()
                .teamName("Idempotency Team")
                .player1DisplayName("Idem P1")
                .player2DisplayName("Idem P2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 2).orElseThrow();

        PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(event.getId()).playerNumber(1).sessionToken("p1_idem_token").build();
        PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(regRes.getId()).eventId(event.getId()).playerNumber(2).sessionToken("p2_idem_token").build();

        // Complete all 6 levels directly in test setup
        for (int i = 1; i <= 6; i++) {
            Level lvl = levelRepository.findByLevelNumber(i).orElseThrow();
            Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(lvl.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(lvl.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(i).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder().levelNumber(i).answer(q2.getExpectedAnswerHash()).build());
        }

        // First Passkey Submission
        FinalPasskeyResponseDto res1 = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder().passkey("123456").build());
        assertThat(res1.getStatus()).isEqualTo("COMPLETED");

        // Second Passkey Submission (Idempotent call)
        FinalPasskeyResponseDto res2 = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder().passkey("123456").build());
        assertThat(res2.getStatus()).isIn("COMPLETED", "ALREADY_COMPLETED");
    }
}
