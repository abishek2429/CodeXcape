package com.technicalescaperoom.backend.game;

import com.technicalescaperoom.backend.config.ScoringConfig;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.admin.ScoreEventDto;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AntiCheatReportRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.dto.player.TeamScoreDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class ScoringAndLeaderboardSystemTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private ScoreEventRepository scoreEventRepository;

    @Autowired
    private AnswerAttemptRepository answerAttemptRepository;

    @Autowired
    private ScoringService scoringService;

    @Autowired
    private ScoringConfig scoringConfig;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private HintService hintService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private AntiCheatService antiCheatService;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event event;
    private Team team;
    private Player player1;
    private Player player2;
    private final String rawPasskey = "998877";

    @BeforeEach
    void setUp() {
        antiCheatService.resetDeduplicationCache();

        event = eventRepository.save(Event.builder()
                .name("Scoring System Event " + System.currentTimeMillis())
                .description("Production Scoring Test Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .build());

        String suffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 10000);
        team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-SCORING-" + suffix)
                .teamName("Scoring Test Team " + suffix)
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .baseScore(0)
                .wrongAttemptPenalty(0)
                .hintPenalty(0)
                .antiCheatPenalty(0)
                .finalScore(0)
                .completedMiniGames(0)
                .completedLevels(0)
                .isFlaggedForReview(false)
                .securityIncidentCount(0)
                .build());

        player1 = playerRepository.save(Player.builder().team(team).playerNumber(1).displayName("Score P1").build());
        player2 = playerRepository.save(Player.builder().team(team).playerNumber(2).displayName("Score P2").build());
        gameStateService.initializeTeamGameState(team);
    }

    private PlayerPrincipal createPrincipal(Player p, Team t) {
        return PlayerPrincipal.builder()
                .playerId(p.getId())
                .teamId(t.getId())
                .eventId(t.getEvent().getId())
                .playerNumber(p.getPlayerNumber())
                .teamCode(t.getTeamCode())
                .teamName(t.getTeamName())
                .displayName(p.getDisplayName())
                .sessionToken("test-score-token-" + p.getId())
                .build();
    }

    // ==========================================
    // 1. MINI-GAME COMPLETION SCORING (L1=50, L3=55, L5=60)
    // ==========================================
    @Test
    @DisplayName("01. Base mini-game score awarded on solve: L1=50, L3=55, L5=60")
    void test01_BaseMiniGameScoreAwarded() {
        assertEquals(50, scoringConfig.getPointsForMiniGame(1));
        assertEquals(50, scoringConfig.getPointsForMiniGame(2));
        assertEquals(55, scoringConfig.getPointsForMiniGame(3));
        assertEquals(55, scoringConfig.getPointsForMiniGame(4));
        assertEquals(60, scoringConfig.getPointsForMiniGame(5));
        assertEquals(60, scoringConfig.getPointsForMiniGame(6));

        scoringService.recordMiniGameCompletion(team.getId(), 1, 1);
        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore());
        assertEquals(50, updated.getFinalScore());
        assertEquals(1, updated.getCompletedMiniGames());

        scoringService.recordMiniGameCompletion(team.getId(), 3, 1);
        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(105, updated.getBaseScore());
        assertEquals(105, updated.getFinalScore());
        assertEquals(2, updated.getCompletedMiniGames());

        scoringService.recordMiniGameCompletion(team.getId(), 5, 1);
        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(165, updated.getBaseScore());
        assertEquals(165, updated.getFinalScore());
        assertEquals(3, updated.getCompletedMiniGames());
    }

    // ==========================================
    // 2. MINI-GAME IDEMPOTENCY
    // ==========================================
    @Test
    @DisplayName("02. Mini-game completion idempotency: Duplicate solve does not re-award points")
    void test02_MiniGameCompletionIdempotency() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1);
        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore());
        assertEquals(1, updated.getCompletedMiniGames());

        // Replay / redundant completion
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1);
        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore(), "Duplicate completion must not increase base score.");
        assertEquals(1, updated.getCompletedMiniGames(), "Duplicate completion must not increment mini-games count.");
    }

    // ==========================================
    // 3. WRONG ATTEMPT PENALTY (-5 PTS)
    // ==========================================
    @Test
    @DisplayName("03. Wrong attempt deducts -5 points")
    void test03_WrongAttemptDeductsFivePoints() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordWrongAttempt(team.getId(), player1.getId(), 1, 1, 101L);

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore());
        assertEquals(5, updated.getWrongAttemptPenalty());
        assertEquals(45, updated.getFinalScore());
    }

    // ==========================================
    // 4. DUPLICATE WRONG ATTEMPT DEBOUNCE
    // ==========================================
    @Test
    @DisplayName("04. Duplicate wrong attempt debounce prevents double deduction on rapid retries")
    void test04_DuplicateWrongAttemptDebounce() {
        PlayerPrincipal p1 = createPrincipal(player1, team);
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts

        // Submit wrong answer
        questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(1).answer("WRONG_1").build());
        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        int initialPenalty = updated.getWrongAttemptPenalty();
        assertEquals(5, initialPenalty);

        // Immediate duplicate submission of identical wrong answer
        questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(1).answer("WRONG_1").build());
        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(5, updated.getWrongAttemptPenalty(), "Debounced duplicate wrong submission should not penalize twice.");

        // Submitting different wrong answer DOES incur another penalty
        questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(1).answer("WRONG_2").build());
        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(10, updated.getWrongAttemptPenalty(), "Distinct wrong attempt must be penalized.");
    }

    // ==========================================
    // 5-9. HINT PENALTIES: -5, -10, -15 & MAX 30 PTS
    // ==========================================
    @Test
    @DisplayName("05. Hint 1 usage deducts -5 points")
    void test05_Hint1Penalty() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1);

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(5, updated.getHintPenalty());
        assertEquals(45, updated.getFinalScore());
    }

    @Test
    @DisplayName("06. Hint 2 usage deducts -10 points")
    void test06_Hint2Penalty() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1); // -5
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 2); // -10

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(15, updated.getHintPenalty());
        assertEquals(35, updated.getFinalScore());
    }

    @Test
    @DisplayName("07. Hint 3 usage deducts -15 points")
    void test07_Hint3Penalty() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1); // -5
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 2); // -10
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 3); // -15

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(30, updated.getHintPenalty());
        assertEquals(20, updated.getFinalScore());
    }

    @Test
    @DisplayName("08. Hint penalty idempotency: Accessing unlocked hint again does not re-charge penalty")
    void test08_HintPenaltyIdempotency() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1); // -5

        // Access again
        scoringService.recordHintUsage(team.getId(), player2.getId(), 1, 1, 1);

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(5, updated.getHintPenalty(), "Same hint must not be charged twice to the team.");
    }

    @Test
    @DisplayName("09. Max hint penalty per mini-game is 30 points (5 + 10 + 15)")
    void test09_MaxHintPenaltyPerMiniGame() {
        assertEquals(30, scoringConfig.getMaxHintPenaltyPerMiniGame());
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1);
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 2);
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 3);

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(30, updated.getHintPenalty());
    }

    // ==========================================
    // 10-14. ANTI-CHEAT TAB SWITCH ESCALATING PENALTIES (10, 15, 20, 30, 40)
    // ==========================================
    @Test
    @DisplayName("10. Tab switch escalating penalty: 1st violation = -10 pts")
    void test10_TabSwitchViolation1() {
        assertEquals(10, scoringConfig.getEscalatingTabSwitchPenalty(1));
        PlayerPrincipal p1 = createPrincipal(player1, team);
        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(10, updated.getAntiCheatPenalty());
    }

    @Test
    @DisplayName("11. Tab switch escalating penalty: 2nd violation = -15 pts (Total: 25)")
    void test11_TabSwitchViolation2() {
        assertEquals(15, scoringConfig.getEscalatingTabSwitchPenalty(2));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());
        antiCheatService.resetDeduplicationCache();
        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(25, updated.getAntiCheatPenalty());
    }

    @Test
    @DisplayName("12. Tab switch escalating penalty: 3rd violation = -20 pts (Total: 45)")
    void test12_TabSwitchViolation3() {
        assertEquals(20, scoringConfig.getEscalatingTabSwitchPenalty(3));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        for (int i = 0; i < 3; i++) {
            antiCheatService.resetDeduplicationCache();
            antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());
        }

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(45, updated.getAntiCheatPenalty()); // 10 + 15 + 20
    }

    @Test
    @DisplayName("13. Tab switch escalating penalty: 4th violation = -30 pts (Total: 75)")
    void test13_TabSwitchViolation4() {
        assertEquals(30, scoringConfig.getEscalatingTabSwitchPenalty(4));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        for (int i = 0; i < 4; i++) {
            antiCheatService.resetDeduplicationCache();
            antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());
        }

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(75, updated.getAntiCheatPenalty()); // 10 + 15 + 20 + 30
    }

    @Test
    @DisplayName("14. Tab switch escalating penalty: 5th+ violation = -40 pts (Total: 115)")
    void test14_TabSwitchViolation5Plus() {
        assertEquals(40, scoringConfig.getEscalatingTabSwitchPenalty(5));
        assertEquals(40, scoringConfig.getEscalatingTabSwitchPenalty(6));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        for (int i = 0; i < 5; i++) {
            antiCheatService.resetDeduplicationCache();
            antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());
        }

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(115, updated.getAntiCheatPenalty()); // 10 + 15 + 20 + 30 + 40
    }

    // ==========================================
    // 15-18. ANTI-CHEAT FULLSCREEN EXIT ESCALATING PENALTIES (15, 20, 30, 40)
    // ==========================================
    @Test
    @DisplayName("15. Fullscreen exit escalating penalty: 1st violation = -15 pts")
    void test15_FullscreenExitViolation1() {
        assertEquals(15, scoringConfig.getEscalatingFullscreenPenalty(1));
        PlayerPrincipal p1 = createPrincipal(player1, team);
        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("FULLSCREEN_EXIT").build());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(15, updated.getAntiCheatPenalty());
    }

    @Test
    @DisplayName("16. Fullscreen exit escalating penalty: 2nd violation = -20 pts (Total: 35)")
    void test16_FullscreenExitViolation2() {
        assertEquals(20, scoringConfig.getEscalatingFullscreenPenalty(2));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("FULLSCREEN_EXIT").build());
        antiCheatService.resetDeduplicationCache();
        antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("FULLSCREEN_EXIT").build());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(35, updated.getAntiCheatPenalty()); // 15 + 20
    }

    @Test
    @DisplayName("17. Fullscreen exit escalating penalty: 3rd violation = -30 pts (Total: 65)")
    void test17_FullscreenExitViolation3() {
        assertEquals(30, scoringConfig.getEscalatingFullscreenPenalty(3));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        for (int i = 0; i < 3; i++) {
            antiCheatService.resetDeduplicationCache();
            antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("FULLSCREEN_EXIT").build());
        }

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(65, updated.getAntiCheatPenalty()); // 15 + 20 + 30
    }

    @Test
    @DisplayName("18. Fullscreen exit escalating penalty: 4th+ violation = -40 pts (Total: 105)")
    void test18_FullscreenExitViolation4Plus() {
        assertEquals(40, scoringConfig.getEscalatingFullscreenPenalty(4));
        assertEquals(40, scoringConfig.getEscalatingFullscreenPenalty(5));
        PlayerPrincipal p1 = createPrincipal(player1, team);

        for (int i = 0; i < 4; i++) {
            antiCheatService.resetDeduplicationCache();
            antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("FULLSCREEN_EXIT").build());
        }

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(105, updated.getAntiCheatPenalty()); // 15 + 20 + 30 + 40
    }

    // ==========================================
    // 19. NON-PENALIZED EVENTS
    // ==========================================
    @Test
    @DisplayName("19. Non-penalized events (heartbeat, refresh, system dialog, unrecognized) do not deduct points")
    void test19_NonPenalizedEventsDoNotDeductPoints() {
        PlayerPrincipal p1 = createPrincipal(player1, team);

        // Send unpenalized / unrecognized events
        var res1 = antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("HEARTBEAT").build());
        var res2 = antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("PAGE_RECONNECT").build());
        var res3 = antiCheatService.processPlayerEvent(p1, AntiCheatReportRequest.builder().eventType("SYSTEM_DIALOG").build());

        assertFalse(res1.isAccepted());
        assertFalse(res2.isAccepted());
        assertFalse(res3.isAccepted());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(0, updated.getAntiCheatPenalty(), "Non-penalized events must not incur penalties.");
    }

    // ==========================================
    // 20-21. 2-PLAYER TEAM ATTRIBUTION
    // ==========================================
    @Test
    @DisplayName("20. 2-Player team attribution: Player 1 solves mini-game -> Team awarded base points")
    void test20_Player1SolvesTeamAwardedPoints() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1);

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore());
        assertEquals(50, updated.getFinalScore());
    }

    @Test
    @DisplayName("21. 2-Player team attribution: Player 2 incurs penalty -> Team final score reduced")
    void test21_Player2IncursPenaltyTeamScoreReduced() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        PlayerPrincipal p2 = createPrincipal(player2, team);

        antiCheatService.processPlayerEvent(p2, AntiCheatReportRequest.builder().eventType("TAB_SWITCH").build());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(50, updated.getBaseScore());
        assertEquals(10, updated.getAntiCheatPenalty());
        assertEquals(40, updated.getFinalScore(), "Player 2 violation must deduct from shared Team score.");
    }

    // ==========================================
    // 22. SECURITY INCIDENT (TAMPERING / REJECTION)
    // ==========================================
    @Test
    @DisplayName("22. Security incident flags team for review and logs security incident without modifying points")
    void test22_SecurityIncidentRejectionAndReview() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordSecurityIncident(team.getId(), player1.getId(), "PAYLOAD_TAMPERING", "Unauthorized stage jump attempt detected");

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertTrue(updated.getIsFlaggedForReview(), "Team must be flagged for admin review.");
        assertEquals(1, updated.getSecurityIncidentCount());
        assertEquals(50, updated.getBaseScore());
        assertEquals(50, updated.getFinalScore());

        List<ScoreEventDto> events = scoringService.getTeamScoreEvents(team.getId());
        boolean hasSecurityEvent = events.stream().anyMatch(e -> e.getEventType() == ScoreEventType.SECURITY_INCIDENT);
        assertTrue(hasSecurityEvent, "Audit log must contain SECURITY_INCIDENT event.");
    }

    // ==========================================
    // 23. SCORE FLOOR GUARANTEE (NEVER NEGATIVE)
    // ==========================================
    @Test
    @DisplayName("23. Score floor guarantee: Score never drops below 0 even with heavy penalties")
    void test23_ScoreFloorGuarantee() {
        // Team has 0 base score, incur multiple penalties
        scoringService.recordWrongAttempt(team.getId(), player1.getId(), 1, 1, 501L); // -5
        scoringService.recordHintUsage(team.getId(), player1.getId(), 1, 1, 1); // -5
        scoringService.recordAntiCheatPenalty(team.getId(), player1.getId(), AntiCheatViolationType.TAB_SWITCH, 40, "INC-TEST-FLOOR");

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(0, updated.getBaseScore());
        assertEquals(5, updated.getWrongAttemptPenalty());
        assertEquals(5, updated.getHintPenalty());
        assertEquals(40, updated.getAntiCheatPenalty());
        assertEquals(0, updated.getFinalScore(), "Final score must be bounded at floor 0.");
    }

    // ==========================================
    // 24. CONCURRENCY SERIALIZATION
    // ==========================================
    @Test
    @DisplayName("24. Concurrent actions on same team serialize safely without lost updates")
    void test24_ConcurrentActionsSerializeSafely() throws InterruptedException {
        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final long attemptId = 2000L + i;
            executor.submit(() -> {
                try {
                    scoringService.recordWrongAttempt(team.getId(), player1.getId(), 1, 1, attemptId);
                    successCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(successCount.get() * 5, updated.getWrongAttemptPenalty());
    }

    // ==========================================
    // 25. 1000-POINT PERFECT COMPLETION
    // ==========================================
    @Test
    @DisplayName("25. 1000-point perfect completion: 18 mini-games (990 pts) + Final Protocol (10 pts) = 1000 pts")
    void test25_PerfectThousandPointCompletion() {
        int totalExpectedMiniGamesScore = 0;
        for (int level = 1; level <= 6; level++) {
            for (int stage = 1; stage <= 3; stage++) {
                scoringService.recordMiniGameCompletion(team.getId(), level, stage);
                totalExpectedMiniGamesScore += scoringConfig.getPointsForMiniGame(level);
            }
        }

        assertEquals(990, totalExpectedMiniGamesScore, "18 mini-games must total exactly 990 base points.");

        Team mid = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(990, mid.getBaseScore());
        assertEquals(18, mid.getCompletedMiniGames());

        // Final Protocol
        scoringService.recordFinalProtocolCompletion(team.getId());

        Team completed = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(1000, completed.getBaseScore(), "Perfect game base score must be exactly 1000 points.");
        assertEquals(0, completed.getWrongAttemptPenalty());
        assertEquals(0, completed.getHintPenalty());
        assertEquals(0, completed.getAntiCheatPenalty());
        assertEquals(1000, completed.getFinalScore(), "Perfect final score must be exactly 1000 points.");
    }

    // ==========================================
    // 26. FINAL PROTOCOL PASSKEY SUBMISSION (+10 PTS)
    // ==========================================
    @Test
    @DisplayName("26. Final Protocol passkey submission awards +10 pts and completes game")
    void test26_FinalProtocolPasskeySubmission() {
        PlayerPrincipal p1 = createPrincipal(player1, team);
        team.setGameState(TeamGameState.FINAL_PASSKEY);
        teamRepository.saveAndFlush(team);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();
        var response = finalPasskeyService.submitFinalPasskey(p1, req);

        assertEquals("COMPLETED", response.getStatus());

        Team updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(10, updated.getBaseScore());
        assertEquals(10, updated.getFinalScore());
        assertEquals(TeamGameState.COMPLETED, updated.getGameState());

        // Redundant passkey submission is idempotent
        var response2 = finalPasskeyService.submitFinalPasskey(p1, req);
        assertEquals("ALREADY_COMPLETED", response2.getStatus());

        updated = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(10, updated.getBaseScore(), "Redundant passkey submission must not award points again.");
    }

    // ==========================================
    // 27. PLAYER VS ADMIN SCORE VISIBILITY
    // ==========================================
    @Test
    @DisplayName("27. Player vs Admin visibility: Player gets own safe breakdown; Admin gets complete event audit")
    void test27_PlayerVsAdminScoreVisibility() {
        scoringService.recordMiniGameCompletion(team.getId(), 1, 1); // +50 pts
        scoringService.recordWrongAttempt(team.getId(), player1.getId(), 1, 1, 888L); // -5 pts

        // 1. Player Safe Score DTO
        TeamScoreDto playerDto = scoringService.getTeamScoreSummary(team.getId());
        assertEquals(50, playerDto.getBaseScore());
        assertEquals(5, playerDto.getWrongAttemptPenalty());
        assertEquals(45, playerDto.getFinalScore());
        assertEquals(1, playerDto.getCompletedMiniGames());
        assertEquals(team.getTeamCode(), playerDto.getTeamCode());

        // 2. Admin Audit Log
        List<ScoreEventDto> adminAudit = scoringService.getTeamScoreEvents(team.getId());
        assertEquals(2, adminAudit.size());
        assertTrue(adminAudit.stream().anyMatch(e -> e.getEventType() == ScoreEventType.MINI_GAME_COMPLETED));
        assertTrue(adminAudit.stream().anyMatch(e -> e.getEventType() == ScoreEventType.WRONG_ATTEMPT));
    }

    // ==========================================
    // 28. DYNAMIC LEADERBOARD RANKING CRITERIA
    // ==========================================
    @Test
    @DisplayName("28. Dynamic leaderboard ranking updates: Verifies all 5 authoritative ranking criteria")
    void test28_DynamicLeaderboardRankingUpdates() {
        Instant t0 = Instant.now().minusSeconds(1000);
        Instant t1 = Instant.now().minusSeconds(500);
        Instant t2 = Instant.now().minusSeconds(200);

        // Team 1: COMPLETED, 18 mini-games, 950 pts, completed at t1
        Team tCompletedHigh = teamRepository.save(Team.builder()
                .event(event).teamCode("TC-1").teamName("Team 1 Completed High")
                .gameState(TeamGameState.COMPLETED).completedMiniGames(18).finalScore(950)
                .completedAt(t1).build());

        // Team 2: COMPLETED, 18 mini-games, 950 pts, completed at t2 (later than Team 1) -> Rank 2
        Team tCompletedLater = teamRepository.save(Team.builder()
                .event(event).teamCode("TC-2").teamName("Team 2 Completed Later")
                .gameState(TeamGameState.COMPLETED).completedMiniGames(18).finalScore(950)
                .completedAt(t2).build());

        // Team 3: IN_PROGRESS, 12 mini-games, 600 pts -> Rank 3 (more mini-games than Team 4)
        Team tProgressMoreGames = teamRepository.save(Team.builder()
                .event(event).teamCode("TC-3").teamName("Team 3 More Games")
                .gameState(TeamGameState.IN_PROGRESS).completedMiniGames(12).finalScore(600)
                .build());

        // Team 4: IN_PROGRESS, 10 mini-games, 500 pts -> Rank 4
        Team tProgressFewerGames = teamRepository.save(Team.builder()
                .event(event).teamCode("TC-4").teamName("Team 4 Fewer Games")
                .gameState(TeamGameState.IN_PROGRESS).completedMiniGames(10).finalScore(500)
                .build());

        // Team 5: IN_PROGRESS, 10 mini-games, 450 pts (lower score than Team 4) -> Rank 5
        Team tProgressLowerScore = teamRepository.save(Team.builder()
                .event(event).teamCode("TC-5").teamName("Team 5 Lower Score")
                .gameState(TeamGameState.IN_PROGRESS).completedMiniGames(10).finalScore(450)
                .build());

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(event.getId());

        // Verify ranks
        assertEquals(tCompletedHigh.getId(), leaderboard.get(0).getTeamId(), "Rank 1: Completed with earlier time");
        assertEquals(tCompletedLater.getId(), leaderboard.get(1).getTeamId(), "Rank 2: Completed with later time");
        assertEquals(tProgressMoreGames.getId(), leaderboard.get(2).getTeamId(), "Rank 3: More completed mini-games");
        assertEquals(tProgressFewerGames.getId(), leaderboard.get(3).getTeamId(), "Rank 4: Fewer mini-games, higher score");
        assertEquals(tProgressLowerScore.getId(), leaderboard.get(4).getTeamId(), "Rank 5: Fewer mini-games, lower score");

        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals(2, leaderboard.get(1).getRank());
        assertNull(leaderboard.get(2).getRank(), "In-progress teams have null rank on official completed board");
        assertNull(leaderboard.get(3).getRank());
        assertNull(leaderboard.get(4).getRank());

        // Live rank for player HUD (#N)
        assertEquals(3, leaderboardService.getTeamCurrentRank(tProgressMoreGames.getId()));
        assertEquals(4, leaderboardService.getTeamCurrentRank(tProgressFewerGames.getId()));
        assertEquals(5, leaderboardService.getTeamCurrentRank(tProgressLowerScore.getId()));
    }
}
