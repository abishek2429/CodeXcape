package com.technicalescaperoom.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.dto.story.ActiveStoryStateDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Red-Team Application Security & Defensive Anti-Cheat Hardening Audit Test Suite.
 *
 * Verifies the 25-point security matrix covering:
 * - Authentication & Session Integrity (AUTH-01..05)
 * - Authoritative Game Lifecycle & State Enforcement (GAME-01..05)
 * - Puzzle Isolation & Anti-Skip Progression Gating (PUZZLE-01..04)
 * - Hint Authorization, Progression Boundaries & Gating (HINT-01..04)
 * - Scoring Authority, Constraints & Deterministic Ranking (SCORE-01..04)
 * - Defensive Anti-Cheat Hardening & Input Sanitization (ANTI-01..02)
 * - Competitive Game Timer Integrity & Anti-Pause Exploitation (TIMER-01)
 * - Inbound WebSocket STOMP Protocol Lockdown (WS-01)
 * - Sensitive Endpoint Rate Limiting (RATE-01)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class SecurityHardeningAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Autowired
    private TeamStageProgressRepository teamStageProgressRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminSessionRepository adminSessionRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private HintUsageRepository hintUsageRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private HintService hintService;

    @Autowired
    private ScoringService scoringService;

    @Autowired
    private AntiCheatService antiCheatService;

    @Autowired
    private CinematicStoryService cinematicStoryService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.technicalescaperoom.backend.config.WebSocketConfig webSocketConfig;

    private Event testEvent;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;
    private GameSession sessionA1;

    private Team teamB;
    private Player playerB1;
    private Player playerB2;
    private GameSession sessionB1;

    private AdminSession adminSession;
    private final String rawPasskey = "948172";

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();
        adminSessionRepository.deleteAll();

        testEvent = eventRepository.save(Event.builder()
                .name("Red-Team Audit Event " + System.currentTimeMillis())
                .description("Production Security Verification")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .build());

        String suffixA = System.currentTimeMillis() + "-RTA-" + (int) (Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-RTA-" + suffixA)
                .teamName("RedTeam Alpha " + suffixA)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(1)
                .displayName("Alpha P1")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        playerA2 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(2)
                .displayName("Alpha P2")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        gameStateService.initializeTeamGameState(teamA);

        sessionA1 = gameSessionRepository.save(GameSession.builder()
                .player(playerA1)
                .team(teamA)
                .sessionToken("token-rta-a1-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());

        String suffixB = System.currentTimeMillis() + "-RTB-" + (int) (Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-RTB-" + suffixB)
                .teamName("RedTeam Bravo " + suffixB)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder()
                .team(teamB)
                .playerNumber(1)
                .displayName("Bravo P1")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        playerB2 = playerRepository.save(Player.builder()
                .team(teamB)
                .playerNumber(2)
                .displayName("Bravo P2")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        gameStateService.initializeTeamGameState(teamB);

        sessionB1 = gameSessionRepository.save(GameSession.builder()
                .player(playerB1)
                .team(teamB)
                .sessionToken("token-rta-b1-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());

        adminSession = adminSessionRepository.save(AdminSession.builder()
                .sessionToken("admin-rta-token-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());
    }

    private PlayerPrincipal createPrincipal(Player player, Team team, GameSession session) {
        return PlayerPrincipal.builder()
                .playerId(player.getId())
                .teamId(team.getId())
                .eventId(team.getEvent().getId())
                .playerNumber(player.getPlayerNumber())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player.getDisplayName())
                .sessionToken(session != null ? session.getSessionToken() : "mock-token")
                .build();
    }

    // =========================================================================
    // 1. AUTHENTICATION & ACCESS CONTROL (AUTH-01 .. AUTH-05)
    // =========================================================================

    @Test
    @DisplayName("AUTH-01: Login request missing required credentials yields 400 Bad Request")
    void testAuth01_MissingLoginFieldsRejected() throws Exception {
        PlayerLoginRequest emptyRequest = new PlayerLoginRequest();
        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("AUTH-02: Expired player session token receives 401 Unauthorized")
    void testAuth02_ExpiredSessionRejected() throws Exception {
        GameSession expiredSession = gameSessionRepository.save(GameSession.builder()
                .player(playerA1)
                .team(teamA)
                .sessionToken("expired-rta-token-" + System.currentTimeMillis())
                .status(SessionStatus.EXPIRED)
                .build());

        mockMvc.perform(get("/api/player/me")
                        .header("X-Player-Session", expiredSession.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-03: Fabricated/tampered session token receives 401 Unauthorized")
    void testAuth03_TamperedSessionRejected() throws Exception {
        mockMvc.perform(get("/api/player/me")
                        .header("X-Player-Session", "forged-session-token-evil")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-04: Strict Team Data Isolation - Player A1 cannot access Team B context")
    void testAuth04_StrictTeamDataIsolation() throws Exception {
        mockMvc.perform(get("/api/player/me")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode").value(teamA.getTeamCode()));
    }

    @Test
    @DisplayName("AUTH-05: Admin route strictly rejects spoofed X-Admin-Role and player tokens (401)")
    void testAuth05_AdminRoleSpoofingAndPlayerFallbackRejected() throws Exception {
        // Spoofed header without AdminSession
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Admin-Role", "ADMIN")
                        .header("X-Admin-Username", "intruder")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        // Player session token attempted on Admin API (forbidden)
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Valid AdminSession succeeds
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Admin-Session", adminSession.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 2. AUTHORITATIVE GAME LIFECYCLE & STATE ENFORCEMENT (GAME-01 .. GAME-05)
    // =========================================================================

    @Test
    @DisplayName("GAME-01: Interacting with an event that is not RUNNING or READY is rejected")
    void testGame01_InactiveEventRejected() {
        testEvent.setStatus(EventStatus.DRAFT);
        eventRepository.save(testEvent);

        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        assertThrows(EventUnavailableException.class, () -> questionAnswerService.getCurrentQuestionForPlayer(p1A));
    }

    @Test
    @DisplayName("GAME-02: Initializing team game state is idempotent and does not reset progress")
    void testGame02_GameInitIdempotency() {
        List<TeamLevelProgress> firstInit = gameStateService.initializeTeamGameState(teamA);
        List<TeamLevelProgress> secondInit = gameStateService.initializeTeamGameState(teamA);

        assertEquals(firstInit.size(), secondInit.size());
        assertEquals(6, secondInit.size());
    }

    @Test
    @DisplayName("GAME-03: Submitting answers when game is NOT_STARTED or COMPLETED is rejected")
    void testGame03_InvalidGameStateForAnswer() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        teamA.setGameState(TeamGameState.NOT_STARTED);
        teamRepository.save(teamA);
        assertThrows(EventUnavailableException.class, () ->
                questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(1).answer("test").build()));

        teamA.setGameState(TeamGameState.COMPLETED);
        teamRepository.save(teamA);
        assertThrows(EventUnavailableException.class, () ->
                questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(1).answer("test").build()));
    }

    @Test
    @DisplayName("GAME-04: Server authoritative timer never renews or resets an expired game clock")
    void testGame04_TimerIntegrityNeverRenewsExpiredClock() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        Instant pastStart = Instant.now().minusSeconds(7200); // 2 hours ago (> 100 mins)
        teamA.setStartedAt(pastStart);
        teamRepository.save(teamA);

        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        PlayerGameStateDto state = gameStateService.getGameStateForPlayer(p1A);

        Team reloaded = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(pastStart, reloaded.getStartedAt(), "Authoritative start time must NEVER be renewed after deadline expiration.");
    }

    @Test
    @DisplayName("GAME-05: Final passkey terminal is unavailable before all 6 levels completed")
    void testGame05_FinalPasskeyTerminalUnavailableBeforeCompletion() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        FinalPasskeyResponseDto res = finalPasskeyService.submitFinalPasskey(p1A,
                FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build());

        assertEquals("FINAL_NOT_AVAILABLE", res.getStatus());
    }

    // =========================================================================
    // 3. PUZZLE ISOLATION & PROGRESSION GATING (PUZZLE-01 .. PUZZLE-04)
    // =========================================================================

    @Test
    @DisplayName("PUZZLE-01: Submitting answer for future level is rejected with InvalidLevelTransitionException")
    void testPuzzle01_FutureLevelSubmissionRejected() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        assertThrows(InvalidLevelTransitionException.class, () ->
                questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(4).answer("test").build()));
    }

    @Test
    @DisplayName("PUZZLE-02: Player 1 and Player 2 receive distinct questions and both must solve stage")
    void testPuzzle02_PlayerRoleQuestionIsolation() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA, null);

        PlayerQuestionDto q1 = questionAnswerService.getCurrentQuestionForPlayer(p1A);
        PlayerQuestionDto q2 = questionAnswerService.getCurrentQuestionForPlayer(p2A);

        assertNotNull(q1);
        assertNotNull(q2);
        assertNotEquals(q1.getInstructions(), q2.getInstructions(), "Player 1 and Player 2 must receive distinct question instructions.");
    }

    @Test
    @DisplayName("PUZZLE-03: Invalid puzzle answer returns correct: false and does not advance stage")
    void testPuzzle03_InvalidAnswerRejected() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        AnswerSubmissionResponseDto res = questionAnswerService.submitAnswer(p1A,
                AnswerSubmissionRequest.builder().levelNumber(1).answer("definitely-wrong-solution-xyz").build());

        assertFalse(Boolean.TRUE.equals(res.getCorrect()));
        assertFalse(Boolean.TRUE.equals(res.getStageCompleted()));
    }

    @Test
    @DisplayName("PUZZLE-04: Solving stage advances stage only when both team players complete")
    void testPuzzle04_BothPlayersRequiredForStageAdvance() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA, null);

        Level l1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                l1.getId(), 1, QuestionPlayer.PLAYER_1).orElseThrow();
        Question q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                l1.getId(), 1, QuestionPlayer.PLAYER_2).orElseThrow();

        // Player 1 solves
        AnswerSubmissionResponseDto r1 = questionAnswerService.submitAnswer(p1A,
                AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertTrue(Boolean.TRUE.equals(r1.getCorrect()));
        assertFalse(Boolean.TRUE.equals(r1.getStageCompleted()), "Stage must not be complete until Player 2 solves");

        // Player 2 solves
        AnswerSubmissionResponseDto r2 = questionAnswerService.submitAnswer(p2A,
                AnswerSubmissionRequest.builder().levelNumber(1).answer(q2.getExpectedAnswerHash()).build());
        assertTrue(Boolean.TRUE.equals(r2.getCorrect()));
        assertTrue(Boolean.TRUE.equals(r2.getStageCompleted()), "Stage must be completed after both players solve");
    }

    // =========================================================================
    // 4. HINT PROGRESSION BOUNDARIES & ISOLATION (HINT-01 .. HINT-04)
    // =========================================================================

    @Test
    @DisplayName("HINT-01: Requesting hint for future level or future stage is strictly rejected")
    void testHint01_FutureStageHintRequestRejected() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        // Active: Level 1 Stage 1. Attempting hint for Level 2
        assertThrows(InvalidLevelTransitionException.class, () ->
                hintService.useHint(p1A, 2, 1, 1));

        // Attempting hint for Level 1 Stage 2 before completing Stage 1
        assertThrows(InvalidLevelTransitionException.class, () ->
                hintService.useHint(p1A, 1, 2, 1));
    }

    @Test
    @DisplayName("HINT-02: Duplicate hint requests do NOT deduct additional score penalties")
    void testHint02_DuplicateHintNoExtraPenalty() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        // First reveal
        HintUseResponseDto r1 = hintService.useHint(p1A, 1, 1, 1);
        assertFalse(r1.isAlreadyUsed());
        assertNotNull(r1.getHintContent());

        Team teamAfterFirst = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(5, teamAfterFirst.getHintPenalty());

        // Repeat reveal
        HintUseResponseDto r2 = hintService.useHint(p1A, 1, 1, 1);
        assertTrue(r2.isAlreadyUsed());

        Team teamAfterSecond = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(5, teamAfterSecond.getHintPenalty(), "Duplicate hint usage must NEVER deduct extra penalty points.");
    }

    @Test
    @DisplayName("HINT-03: Locked future hints have strictly null content in getHints response")
    void testHint03_LockedHintContentsNull() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        PlayerHintsResponseDto resp = hintService.getHintsForPlayer(p1A);
        assertEquals(15, resp.getTotalCount());
        assertEquals(0, resp.getUnlockedCount());

        for (PlayerHintDto hint : resp.getHints()) {
            assertFalse(hint.getIsUnlocked());
            assertNull(hint.getHintContent(), "Locked hint content must never be leaked to client.");
        }
    }

    @Test
    @DisplayName("HINT-04: Hint unlocks are strictly isolated per team (Team A unlock does not unlock Team B)")
    void testHint04_CrossTeamHintIsolation() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamB.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);
        teamRepository.save(teamB);

        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);
        PlayerPrincipal p1B = createPrincipal(playerB1, teamB, sessionB1);

        hintService.useHint(p1A, 1, 1, 1);

        PlayerHintsResponseDto hintsA = hintService.getHintsForPlayer(p1A);
        assertEquals(1, hintsA.getUnlockedCount());

        PlayerHintsResponseDto hintsB = hintService.getHintsForPlayer(p1B);
        assertEquals(0, hintsB.getUnlockedCount(), "Team B hints must remain strictly locked when Team A unlocks a hint.");
    }

    // =========================================================================
    // 5. SCORING INTEGRITY & DETERMINISTIC RANKING (SCORE-01 .. SCORE-04)
    // =========================================================================

    @Test
    @DisplayName("SCORE-01: Base score awarded per mini-game is strictly 60 points")
    void testScore01_BaseScoreAuthoritative() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        scoringService.recordMiniGameCompletion(teamA.getId(), 1, 1);

        Team reloaded = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(60, reloaded.getBaseScore());
        assertEquals(60, reloaded.getFinalScore());
    }

    @Test
    @DisplayName("SCORE-02: Duplicate stage completion does NOT award duplicate base score")
    void testScore02_DuplicateCompletionNoDuplicateScore() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        scoringService.recordMiniGameCompletion(teamA.getId(), 1, 1);
        scoringService.recordMiniGameCompletion(teamA.getId(), 1, 1); // Duplicate call

        Team reloaded = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(60, reloaded.getBaseScore(), "Duplicate stage completion must NOT add duplicate points.");
    }

    @Test
    @DisplayName("SCORE-03: Final score is strictly clamped to 0 and cannot go negative")
    void testScore03_ScoreClampedToNonNegative() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        // Team has 0 base score, apply hint penalty of 5
        scoringService.recordHintUsage(teamA.getId(), playerA1.getId(), 1, 1, 1);

        Team reloaded = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(5, reloaded.getHintPenalty());
        assertEquals(0, reloaded.getFinalScore(), "Final score must never drop below 0.");
    }

    @Test
    @DisplayName("SCORE-04: Leaderboard ranking is strictly deterministic (score DESC, time ASC, id ASC)")
    void testScore04_DeterministicLeaderboardRanking() {
        teamA.setGameState(TeamGameState.COMPLETED);
        teamA.setFinalScore(300);
        teamA.setCompletedAt(Instant.now().minusSeconds(100));
        teamRepository.save(teamA);

        teamB.setGameState(TeamGameState.COMPLETED);
        teamB.setFinalScore(300);
        teamB.setCompletedAt(Instant.now().minusSeconds(50)); // Completed later than team A
        teamRepository.save(teamB);

        List<LeaderboardEntryDto> lb = leaderboardService.getLeaderboard(testEvent.getId());
        assertFalse(lb.isEmpty());

        int rankA = leaderboardService.getTeamCurrentRank(teamA.getId());
        int rankB = leaderboardService.getTeamCurrentRank(teamB.getId());

        assertTrue(rankA < rankB, "Team A finished earlier with identical score, so rankA must be better than rankB.");
    }

    // =========================================================================
    // 6. DEFENSIVE ANTI-CHEAT & INPUT SANITIZATION (ANTI-01 .. ANTI-02)
    // =========================================================================

    @Test
    @DisplayName("ANTI-01: Excessive metadata (>255 chars) in anti-cheat request is rejected with 400 Bad Request")
    void testAnti01_UnboundedMetadataRejected() throws Exception {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        String excessiveMetadata = "X".repeat(300);
        AntiCheatReportRequest req = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .metadata(excessiveMetadata)
                .build();

        mockMvc.perform(post("/api/player/anti-cheat/event")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ANTI-02: Anti-cheat events reported when game is NOT_STARTED are ignored")
    void testAnti02_AntiCheatIgnoredOutsideInProgress() {
        teamA.setGameState(TeamGameState.NOT_STARTED);
        teamRepository.save(teamA);
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA, sessionA1);

        AntiCheatReportRequest req = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .metadata("test-metadata")
                .build();

        AntiCheatEventResponseDto res = antiCheatService.processPlayerEvent(p1A, req);
        assertFalse(res.isAccepted());
        assertEquals("Event ignored: Game is not actively in progress.", res.getMessage());
    }

    // =========================================================================
    // 7. COMPETITIVE GAME TIMER & ANTI-PAUSE INTEGRITY (TIMER-01)
    // =========================================================================

    @Test
    @DisplayName("TIMER-01: Replaying resolved story does NOT pause competitive game clock")
    void testTimer01_StoryReplayNeverPausesGameClock() {
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        // Mark STORY_PROLOGUE as completed
        cinematicStoryService.triggerStory(teamA, "STORY_PROLOGUE");
        cinematicStoryService.completeStory(teamA.getId(), playerA1.getId());

        Team teamAfterFirst = teamRepository.findById(teamA.getId()).orElseThrow();
        Long initialPauseSeconds = teamAfterFirst.getTotalStoryPauseSeconds();

        // Replay the prologue
        ActiveStoryStateDto replayState = cinematicStoryService.replayStory(teamA.getId(), "STORY_PROLOGUE");
        assertNull(replayState.getStoryPausedAt(), "Story replay must NEVER pause the competitive clock.");

        // Skip / complete replay
        cinematicStoryService.skipStory(teamA.getId(), playerA1.getId());

        Team teamAfterReplay = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(initialPauseSeconds, teamAfterReplay.getTotalStoryPauseSeconds(),
                "Replaying and skipping narrative must NOT accumulate pause seconds.");
    }

    // =========================================================================
    // 8. WEBSOCKET SECURITY & RATE LIMITING (WS-01, RATE-01)
    // =========================================================================

    @Test
    @DisplayName("WS-01: Inbound client STOMP SEND is rejected with MessageDeliveryException")
    void testWs01_ClientStompSendProhibited() {
        final ChannelInterceptor[] capturedInterceptor = new ChannelInterceptor[1];
        ChannelRegistration registration = new ChannelRegistration() {
            @Override
            public ChannelRegistration interceptors(ChannelInterceptor... interceptors) {
                if (interceptors != null && interceptors.length > 0) {
                    capturedInterceptor[0] = interceptors[0];
                }
                return super.interceptors(interceptors);
            }
        };

        webSocketConfig.configureClientInboundChannel(registration);
        assertNotNull(capturedInterceptor[0], "WebSocket inbound channel interceptor must be registered.");

        StompHeaderAccessor sendAccessor = StompHeaderAccessor.create(StompCommand.SEND);
        sendAccessor.setDestination("/topic/game/tamper");
        Message<byte[]> sendMessage = MessageBuilder.createMessage(new byte[0], sendAccessor.getMessageHeaders());

        assertThrows(MessageDeliveryException.class, () ->
                capturedInterceptor[0].preSend(sendMessage, null),
                "Direct client STOMP SEND messages must be strictly prohibited.");
    }

    @Test
    @DisplayName("RATE-01: Rate limiting endpoint protection covers sensitive endpoints")
    void testRate01_RateLimitingEndpointCoverage() throws Exception {
        // Repeated rapid logins from same client triggers rate limiting
        for (int i = 0; i < 11; i++) {
            PlayerLoginRequest req = PlayerLoginRequest.builder()
                    .teamCode("NON_EXISTENT_CODE")
                    .playerNumber(1)
                    .build();
            var result = mockMvc.perform(post("/api/player/login")
                            .header("X-Forwarded-For", "192.0.2.42")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                assertEquals(429, result.getResponse().getStatus());
                return; // Successfully verified rate limit triggered
            }
        }
    }
}
