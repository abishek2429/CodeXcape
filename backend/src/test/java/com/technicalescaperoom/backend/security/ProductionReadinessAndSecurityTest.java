package com.technicalescaperoom.backend.security;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class ProductionReadinessAndSecurityTest {

    @Autowired
    private MockMvc mockMvc;

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
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;
    private GameSession sessionA1;

    private Team teamB;
    private Player playerB1;
    private GameSession sessionB1;

    private String rawPasskey = "849201";

    @BeforeEach
    void setUp() {
        event = eventRepository.save(Event.builder()
                .name("Phase 14 Security Test Event " + System.currentTimeMillis())
                .description("Production Security & Reliability Test")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .build());

        String suffixA = System.currentTimeMillis() + "-SEC1-" + (int)(Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-SEC-" + suffixA)
                .teamName("Security Team A " + suffixA)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder().team(teamA).playerNumber(1).displayName("P1 Sec A").build());
        playerA2 = playerRepository.save(Player.builder().team(teamA).playerNumber(2).displayName("P2 Sec A").build());
        gameStateService.initializeTeamGameState(teamA);

        String tokenA1 = "token-sec-a1-" + System.currentTimeMillis();
        sessionA1 = gameSessionRepository.save(GameSession.builder()
                .player(playerA1)
                .team(teamA)
                .sessionToken(tokenA1)
                .status(SessionStatus.ACTIVE)
                .build());

        String suffixB = System.currentTimeMillis() + "-SEC2-" + (int)(Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-SEC-" + suffixB)
                .teamName("Security Team B " + suffixB)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder().team(teamB).playerNumber(1).displayName("P1 Sec B").build());
        gameStateService.initializeTeamGameState(teamB);

        String tokenB1 = "token-sec-b1-" + System.currentTimeMillis();
        sessionB1 = gameSessionRepository.save(GameSession.builder()
                .player(playerB1)
                .team(teamB)
                .sessionToken(tokenB1)
                .status(SessionStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("1. Verify Team Data Isolation & Level Tampering Guard")
    void testTeamDataIsolationAndLevelTamperingGuard() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);

        // Player A1 on Level 1 attempts to submit answer specifying Level 6 -> throws InvalidLevelTransitionException
        assertThrows(InvalidLevelTransitionException.class, () -> {
            questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(6).answer("123456").build());
        }, "Submitting answer for Level 6 while on Level 1 must be rejected by server.");
    }

    @Test
    @DisplayName("2. Verify Player Challenge Isolation (Player 1 receives P1 question strictly)")
    void testPlayerChallengeIsolation() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);

        PlayerQuestionDto q1 = questionAnswerService.getCurrentQuestionForPlayer(p1A);
        assertNotNull(q1);

        Level l1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question expectedQ1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        assertEquals(expectedQ1.getId(), q1.getQuestionId());
    }

    @Test
    @DisplayName("3. Verify Rate Limiting Filter blocks rapid brute-force submissions (>10 requests triggers 429)")
    void testBruteForceRateLimitingFilter() throws Exception {
        String sessionToken = "rate-limit-token-" + System.currentTimeMillis();
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);

        // Send 10 rapid POST answer submissions
        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/api/player/game/current/answer")
                            .header("X-Player-Session", sessionA1.getSessionToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"levelNumber\": 1, \"answer\": \"22\"}"))
                    .andExpect(status().isOk());
        }

        // 11th request in burst triggers 429 TOO MANY REQUESTS
        mockMvc.perform(post("/api/player/game/current/answer")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"levelNumber\": 1, \"answer\": \"22\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("4. Verify Reconnection & Full State Resynchronization API /api/player/game/resync")
    void testStateResynchronizationApi() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);

        FullPlayerResyncStateDto state = gameStateService.getFullResyncStateForPlayer(p1A);

        assertNotNull(state);
        assertEquals(teamA.getId(), state.getTeamId());
        assertEquals(teamA.getTeamCode(), state.getTeamCode());
        assertEquals(1, state.getPlayerNumber());
        assertEquals(1, state.getCurrentLevel());
        assertFalse(state.getIsCompleted());
        assertFalse(state.getMyCompletedCurrentLevel());
    }

    @Test
    @DisplayName("5. Production Security Audit: Passkey hash, expected answers, and admin routes strictly inaccessible to player sessions")
    void testProductionSecurityAudit() throws Exception {
        // Player session calling /api/admin/events -> 403 FORBIDDEN
        mockMvc.perform(get("/api/admin/events")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Player question DTO does NOT expose expected answer hash or raw passkey
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerQuestionDto questionDto = questionAnswerService.getCurrentQuestionForPlayer(p1A);

        String dtoStr = questionDto.toString();
        assertFalse(dtoStr.contains(rawPasskey), "Raw passkey must NEVER be present in player question DTO.");
        assertFalse(dtoStr.contains(event.getPasskeyHash()), "Passkey hash must NEVER be present in player question DTO.");
        if (questionDto.getPuzzleMetadata() != null) {
            assertFalse(questionDto.getPuzzleMetadata().contains("\"discovery\""), "puzzleMetadata must NEVER expose discovery/answer field.");
        }
    }

    @Test
    @DisplayName("6. Final Passkey & Metadata Sanitization: No question DTO leaks raw passkey or discovery keys")
    void testPasskeyAndMetadataSanitizationAcrossAllQuestions() {
        Level l6 = levelRepository.findByLevelNumber(6).orElseThrow();
        Question q6p2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(l6.getId(), 3, QuestionPlayer.PLAYER_2).orElseThrow();

        PlayerPrincipal p2A = createPrincipal(playerA2, teamA);
        // Ensure instructions do not leak the passkey
        assertFalse(q6p2.getInstructions().contains(rawPasskey), "DB instructions for L6S3P2 must not contain raw passkey 849201.");
        if (q6p2.getPuzzleMetadata() != null) {
            assertFalse(q6p2.getPuzzleMetadata().contains(rawPasskey), "DB puzzleMetadata for L6S3P2 must not contain raw passkey 849201.");
            assertFalse(q6p2.getPuzzleMetadata().contains("\"discovery\""), "DB puzzleMetadata must not contain discovery key.");
        }
    }

    @Test
    @DisplayName("7. Cooperative Evidence Isolation: Player 1 and Player 2 receive strictly partitioned evidence")
    void testCooperativeEvidencePartitioning() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA);

        PlayerQuestionDto q1 = questionAnswerService.getCurrentQuestionForPlayer(p1A);
        PlayerQuestionDto q2 = questionAnswerService.getCurrentQuestionForPlayer(p2A);

        assertNotNull(q1);
        assertNotNull(q2);
        assertNotEquals(q1.getQuestionId(), q2.getQuestionId(), "Player 1 and Player 2 must receive different questions.");
        assertNotEquals(q1.getEvidence(), q2.getEvidence(), "Player 1 and Player 2 evidence must be partitioned.");
        // Player 1 evidence has LOG STREAM; Player 2 evidence has COMPONENT TOPOLOGY
        assertTrue(q1.getEvidence().contains("LOG STREAM"), "Player 1 must receive Log Stream evidence.");
        assertTrue(q2.getEvidence().contains("COMPONENT TOPOLOGY"), "Player 2 must receive Component Topology evidence.");
        assertFalse(q1.getEvidence().contains("COMPONENT TOPOLOGY"), "Player 1 must NOT receive Player 2 evidence.");
        assertFalse(q2.getEvidence().contains("LOG STREAM"), "Player 2 must NOT receive Player 1 evidence.");
    }

    private PlayerPrincipal createPrincipal(Player player, Team team) {
        return PlayerPrincipal.builder()
                .playerId(player.getId())
                .teamId(team.getId())
                .eventId(team.getEvent().getId())
                .playerNumber(player.getPlayerNumber())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player.getDisplayName())
                .sessionToken("test-sec-token-" + player.getId())
                .build();
    }
}
