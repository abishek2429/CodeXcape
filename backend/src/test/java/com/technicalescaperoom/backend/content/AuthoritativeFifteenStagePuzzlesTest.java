package com.technicalescaperoom.backend.content;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.FinalPasskeyService;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class AuthoritativeFifteenStagePuzzlesTest {

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamStageProgressRepository teamStageProgressRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    private Event event;
    private Team team;
    private Player player1;
    private Player player2;
    private PlayerPrincipal p1Principal;
    private PlayerPrincipal p2Principal;

    private static final Map<String, String> AUTHORITATIVE_ANSWERS = Map.ofEntries(
            Map.entry("L1-S1", "x=48, y=34"),
            Map.entry("L1-S2", "[4, 7, 8, 9, 5, 8]"),
            Map.entry("L2-S1", "7, 5, 8"),
            Map.entry("L2-S2", "63 | O(log n)"),
            Map.entry("L3-S1", "10.0.2.15 -> 10.0.2.1 -> 10.0.3.1 -> 10.0.5.1 -> 10.0.5.20 | TCP"),
            Map.entry("L3-S2", "172.16.40.65 - 172.16.40.94 | C"),
            Map.entry("L4-S1", "ASHA, CHITRA"),
            Map.entry("L4-S2", "500"),
            Map.entry("L4-S3", "A"),
            Map.entry("L5-S1", "Hello"),
            Map.entry("L5-S2", "AUTHORIZATION"),
            Map.entry("L5-S3", "HEKKO"),
            Map.entry("L6-S1", "CCX"),
            Map.entry("L6-S2", "A"),
            Map.entry("L6-S3", "CHITRA")
    );

    @BeforeEach
    void setUp() {
        event = eventRepository.findAll().stream().findFirst()
                .orElseGet(() -> eventRepository.save(Event.builder()
                        .name("Authoritative Puzzle Test Event")
                        .description("Test Event")
                        .status(EventStatus.RUNNING)
                        .passkeyHash("$2a$10$7vB9f1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m")
                        .build()));

        String suffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 10000);
        team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-AUTH-" + suffix)
                .teamName("Authoritative Testers " + suffix)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        player1 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Auth P1")
                .status(PlayerStatus.INACTIVE)
                .build());

        player2 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Auth P2")
                .status(PlayerStatus.INACTIVE)
                .build());

        p1Principal = PlayerPrincipal.builder()
                .playerId(player1.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(1)
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player1.getDisplayName())
                .sessionToken("test-auth-p1-" + player1.getId())
                .isActive(true)
                .build();

        p2Principal = PlayerPrincipal.builder()
                .playerId(player2.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(2)
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player2.getDisplayName())
                .sessionToken("test-auth-p2-" + player2.getId())
                .isActive(true)
                .build();

        gameStateService.initializeTeamGameState(team);
    }

    @Test
    @DisplayName("Verify Exact 6 Levels and 15 Stages Structure [2, 2, 2, 3, 3, 3]")
    void testExactFifteenStagesStructure() {
        List<Level> levels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        assertEquals(6, levels.size(), "Game must contain exactly 6 active levels");

        int[] expectedStages = {2, 2, 2, 3, 3, 3};
        int totalActiveStages = 0;

        for (int i = 0; i < 6; i++) {
            Level level = levels.get(i);
            int levelNum = level.getLevelNumber();
            assertEquals(i + 1, levelNum);

            List<Question> questions = questionRepository.findByLevelIdAndIsActiveTrue(level.getId());
            long distinctStages = questions.stream().map(Question::getStageNumber).distinct().count();
            assertEquals(expectedStages[i], distinctStages,
                    "Level " + levelNum + " must have exactly " + expectedStages[i] + " stages.");

            totalActiveStages += distinctStages;
        }

        assertEquals(15, totalActiveStages, "Total active stages across all 6 levels must equal exactly 15.");
    }

    @Test
    @DisplayName("Test End-to-End Progression Across All 15 Stages with Zero Answer Leakage")
    void testAllFifteenStagesEndToEnd() {
        int[][] stagesPerLevel = {
                {1, 1}, {1, 2},
                {2, 1}, {2, 2},
                {3, 1}, {3, 2},
                {4, 1}, {4, 2}, {4, 3},
                {5, 1}, {5, 2}, {5, 3},
                {6, 1}, {6, 2}, {6, 3}
        };

        for (int[] pair : stagesPerLevel) {
            int levelNum = pair[0];
            int stageNum = pair[1];
            String stageKey = "L" + levelNum + "-S" + stageNum;
            String correctAnswer = AUTHORITATIVE_ANSWERS.get(stageKey);
            assertNotNull(correctAnswer, "Missing answer mapping for " + stageKey);

            // 1. Fetch current question for P1 & P2
            PlayerQuestionDto p1Q = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
            PlayerQuestionDto p2Q = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);

            assertEquals(levelNum, p1Q.getLevelNumber(), "P1 level mismatch for " + stageKey);
            assertEquals(stageNum, p1Q.getStageNumber(), "P1 stage mismatch for " + stageKey);
            assertEquals(levelNum, p2Q.getLevelNumber(), "P2 level mismatch for " + stageKey);
            assertEquals(stageNum, p2Q.getStageNumber(), "P2 stage mismatch for " + stageKey);

            // 2. Critical Security Audit: Ensure Player DTO does NOT leak the answer
            if (correctAnswer.length() > 1) {
                assertFalse(p1Q.getInstructions().contains(correctAnswer),
                        "Security Violation: Instructions leak answer on " + stageKey);
                assertFalse(p2Q.getInstructions().contains(correctAnswer),
                        "Security Violation: Instructions leak answer on " + stageKey);
            } else {
                assertFalse(p1Q.getInstructions().toLowerCase().contains("answer is " + correctAnswer.toLowerCase()),
                        "Security Violation: Instructions leak answer option on " + stageKey);
                assertFalse(p2Q.getInstructions().toLowerCase().contains("answer is " + correctAnswer.toLowerCase()),
                        "Security Violation: Instructions leak answer option on " + stageKey);
            }

            // 3. Test Incorrect Answer is Rejected
            AnswerSubmissionResponseDto incorrectRes = questionAnswerService.submitAnswer(
                    p1Principal,
                    AnswerSubmissionRequest.builder()
                            .levelNumber(levelNum)
                            .answer("INCORRECT_SUBMISSION_VAL")
                            .build()
            );
            assertFalse(Boolean.TRUE.equals(incorrectRes.getCorrect()), "Incorrect answer must not be accepted for " + stageKey);

            // 4. Test Correct Team Answer Accepted: Both players submit to verify cooperative stage completion
            AnswerSubmissionResponseDto p1Res = questionAnswerService.submitAnswer(
                    p1Principal,
                    AnswerSubmissionRequest.builder()
                            .levelNumber(levelNum)
                            .answer(correctAnswer)
                            .build()
            );
            assertTrue(Boolean.TRUE.equals(p1Res.getCorrect()), "P1 correct answer must be accepted for " + stageKey);
            assertFalse(Boolean.TRUE.equals(p1Res.getStageCompleted()), "Stage must wait for partner completion on " + stageKey);

            AnswerSubmissionResponseDto p2Res = questionAnswerService.submitAnswer(
                    p2Principal,
                    AnswerSubmissionRequest.builder()
                            .levelNumber(levelNum)
                            .answer(correctAnswer)
                            .build()
            );
            assertTrue(Boolean.TRUE.equals(p2Res.getCorrect()), "P2 correct answer must be accepted for " + stageKey);
            assertTrue(Boolean.TRUE.equals(p2Res.getStageCompleted()), "Stage must be marked completed for " + stageKey);

            // 5. Verify persistence for both players (team-based progression)
            Level lvl = levelRepository.findByLevelNumber(levelNum).orElseThrow();
            TeamStageProgress progress = teamStageProgressRepository
                    .findByTeamIdAndLevelIdAndStageNumber(team.getId(), lvl.getId(), stageNum)
                    .orElseThrow();
            assertTrue(progress.getPlayer1Completed(), "P1 progress must be persisted for " + stageKey);
            assertTrue(progress.getPlayer2Completed(), "P2 progress must be persisted for " + stageKey);
        }

        // 8. After completing Level 6 Stage 3, team transitions to FINAL_PASSKEY
        Team teamFinal = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(TeamGameState.FINAL_PASSKEY, teamFinal.getGameState(),
                "Team must transition to FINAL_PASSKEY after completing all 15 stages.");

        // 9. Submit Final Master Passkey (849201)
        var passkeyRes = finalPasskeyService.submitFinalPasskey(
                p1Principal,
                com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest.builder()
                        .passkey("849201")
                        .build()
        );
        assertEquals("COMPLETED", passkeyRes.getStatus());

        Team teamDone = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(TeamGameState.COMPLETED, teamDone.getGameState(),
                "Team must transition to COMPLETED after valid final passkey.");
    }

    @Test
    @DisplayName("Anti-Skipping: Direct submission for future levels must be blocked")
    void testAntiSkippingEnforcement() {
        // Team is currently on Level 1 Stage 1
        assertThrows(InvalidLevelTransitionException.class, () -> {
            questionAnswerService.submitAnswer(
                    p1Principal,
                    AnswerSubmissionRequest.builder()
                            .levelNumber(2)
                            .answer("7, 5, 8")
                            .build()
            );
        }, "Submitting answer for Level 2 while on Level 1 must throw InvalidLevelTransitionException");

        assertThrows(InvalidLevelTransitionException.class, () -> {
            questionAnswerService.submitAnswer(
                    p1Principal,
                    AnswerSubmissionRequest.builder()
                            .levelNumber(6)
                            .answer("CCX")
                            .build()
            );
        }, "Submitting answer for Level 6 while on Level 1 must throw InvalidLevelTransitionException");
    }
}
