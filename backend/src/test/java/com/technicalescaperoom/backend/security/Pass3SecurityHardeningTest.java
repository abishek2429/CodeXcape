package com.technicalescaperoom.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeyResponseDto;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.dto.player.PlayerLoginRequest;
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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class Pass3SecurityHardeningTest {

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
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminSessionRepository adminSessionRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

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
    private GameSession sessionB1;

    private AdminSession adminSession;
    private final String rawPasskey = "948172";

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();
        adminSessionRepository.deleteAll();

        testEvent = eventRepository.save(Event.builder()
                .name("Pass 3 Security Hardening Event " + System.currentTimeMillis())
                .description("Production Security Hardening")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .build());

        String suffixA = System.currentTimeMillis() + "-SEC3A-" + (int)(Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-SEC3A-" + suffixA)
                .teamName("Alpha Team " + suffixA)
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
                .sessionToken("token-sec3-a1-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());

        String suffixB = System.currentTimeMillis() + "-SEC3B-" + (int)(Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-SEC3B-" + suffixB)
                .teamName("Bravo Team " + suffixB)
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

        gameStateService.initializeTeamGameState(teamB);

        sessionB1 = gameSessionRepository.save(GameSession.builder()
                .player(playerB1)
                .team(teamB)
                .sessionToken("token-sec3-b1-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());

        adminSession = adminSessionRepository.save(AdminSession.builder()
                .sessionToken("admin-sec3-token-" + System.currentTimeMillis())
                .status(SessionStatus.ACTIVE)
                .build());
    }

    // ==========================================
    // 1. AUTHENTICATION & SESSION FLOW
    // ==========================================

    @Test
    @DisplayName("1. Repeated Login -> Logout -> Login again without altering player is_active")
    void testValidLoginRepeatedlyAndLogoutMaintainsAccountStatus() throws Exception {
        PlayerLoginRequest loginReq = PlayerLoginRequest.builder()
                .teamCode(teamA.getTeamCode())
                .playerNumber(1)
                .build();

        // 1. First Login
        MvcResult res1 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionToken").isNotEmpty())
                .andExpect(cookie().exists("PLAYER_SESSION"))
                .andReturn();

        Player reloadedPlayer1 = playerRepository.findById(playerA1.getId()).orElseThrow();
        assertTrue(reloadedPlayer1.getIsActive(), "Login must NOT alter player is_active");

        String token1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("sessionToken").asText();

        // 2. Logout
        mockMvc.perform(post("/api/player/logout")
                        .header("X-Player-Session", token1))
                .andExpect(status().isOk());

        GameSession s1 = gameSessionRepository.findBySessionToken(token1).orElseThrow();
        assertEquals(SessionStatus.TERMINATED, s1.getStatus(), "Logout must invalidate the session token");

        Player reloadedPlayer2 = playerRepository.findById(playerA1.getId()).orElseThrow();
        assertTrue(reloadedPlayer2.getIsActive(), "Logout must NOT set player is_active = false");

        // 3. Login Again Immediately
        MvcResult res2 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionToken").isNotEmpty())
                .andReturn();

        String token2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("sessionToken").asText();
        assertNotEquals(token1, token2, "New login must produce a new active session");

        Player reloadedPlayer3 = playerRepository.findById(playerA1.getId()).orElseThrow();
        assertTrue(reloadedPlayer3.getIsActive(), "Second login must maintain active player status");
    }

    @Test
    @DisplayName("2. Disabled player (is_active = false) cannot login (receives 403 FORBIDDEN)")
    void testDisabledPlayerLoginFails() throws Exception {
        playerA1.setIsActive(false);
        playerRepository.save(playerA1);

        PlayerLoginRequest loginReq = PlayerLoginRequest.builder()
                .teamCode(teamA.getTeamCode())
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Nonexistent team code fails authentication with 404 NOT FOUND")
    void testInvalidTeamCodeFails() throws Exception {
        PlayerLoginRequest loginReq = PlayerLoginRequest.builder()
                .teamCode("NONEXISTENT-TEAM-CODE")
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // 2. AUTHORIZATION & ADMIN SECURITY
    // ==========================================

    @Test
    @DisplayName("4. Player cannot access Admin API (receives 403 FORBIDDEN)")
    void testPlayerCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("5. Unauthenticated request to Admin API receives 401 UNAUTHORIZED")
    void testUnauthenticatedAdminAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("6. Spoofed X-Admin-Role header without valid AdminSession receives 401 UNAUTHORIZED")
    void testSpoofedAdminHeaderWithoutSessionFails() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Admin-Role", "ADMIN")
                        .header("X-Admin-Username", "intruder")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("7. Valid AdminSession token grants access to Admin API")
    void testAuthenticatedAdminCanAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + testEvent.getId() + "/dashboard")
                        .header("X-Admin-Session", adminSession.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 3. PLAYER & TEAM DATA ISOLATION
    // ==========================================

    @Test
    @DisplayName("8. Player A1 cannot access Team B data; identity is authoritative from session")
    void testPlayerCannotAccessAnotherTeamState() throws Exception {
        // Player A1 calls /api/player/me -> returns Team A data
        mockMvc.perform(get("/api/player/me")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode").value(teamA.getTeamCode()))
                .andExpect(jsonPath("$.playerNumber").value(1));

        // Player B1 calls /api/player/me -> returns Team B data
        mockMvc.perform(get("/api/player/me")
                        .header("X-Player-Session", sessionB1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode").value(teamB.getTeamCode()))
                .andExpect(jsonPath("$.playerNumber").value(1));
    }

    // ==========================================
    // 4. GAME STATE TAMPERING & PROGRESSION
    // ==========================================

    @Test
    @DisplayName("9. Client cannot skip levels by submitting answers for future levels directly")
    void testGameCannotBeSkippedDirectly() {
        PlayerPrincipal p1A = PlayerPrincipal.builder()
                .playerId(playerA1.getId())
                .teamId(teamA.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .teamCode(teamA.getTeamCode())
                .teamName(teamA.getTeamName())
                .displayName(playerA1.getDisplayName())
                .sessionToken(sessionA1.getSessionToken())
                .build();

        // Start event for teamA
        teamA.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(teamA);

        // Attempt answer submission for Level 5 while team is on Level 1
        assertThrows(InvalidLevelTransitionException.class, () -> {
            questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder()
                    .levelNumber(5)
                    .answer("bypass")
                    .build());
        });
    }

    // ==========================================
    // 5. PASSKEY SECURITY
    // ==========================================

    @Test
    @DisplayName("10. Final Passkey terminal rejected before all 6 levels completed")
    void testFinalPasskeyTerminalBlockedBeforeAllLevelsCompleted() {
        PlayerPrincipal p1A = PlayerPrincipal.builder()
                .playerId(playerA1.getId())
                .teamId(teamA.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .teamCode(teamA.getTeamCode())
                .teamName(teamA.getTeamName())
                .displayName(playerA1.getDisplayName())
                .sessionToken(sessionA1.getSessionToken())
                .build();

        FinalPasskeyResponseDto res = finalPasskeyService.submitFinalPasskey(p1A,
                FinalPasskeySubmissionRequest.builder().passkey("948172").build());

        assertEquals("FINAL_NOT_AVAILABLE", res.getStatus());
    }

    @Test
    @DisplayName("11. Final Passkey validation is server-side and never echoes actual passkey")
    void testFinalPasskeyValidationSecuredAndNeverLeaked() {
        PlayerPrincipal p1A = PlayerPrincipal.builder()
                .playerId(playerA1.getId())
                .teamId(teamA.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .teamCode(teamA.getTeamCode())
                .teamName(teamA.getTeamName())
                .displayName(playerA1.getDisplayName())
                .sessionToken(sessionA1.getSessionToken())
                .build();

        // Mark all 6 levels completed
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(teamA.getId());
        for (TeamLevelProgress tlp : progressList) {
            tlp.setLevelStatus(LevelStatus.COMPLETED);
            teamLevelProgressRepository.save(tlp);
        }
        teamA.setGameState(TeamGameState.FINAL_PASSKEY);
        teamRepository.save(teamA);

        // Submit incorrect passkey
        FinalPasskeyResponseDto wrongRes = finalPasskeyService.submitFinalPasskey(p1A,
                FinalPasskeySubmissionRequest.builder().passkey("111111").build());

        assertEquals("INCORRECT", wrongRes.getStatus());
        assertFalse(wrongRes.toString().contains(rawPasskey), "Response must NOT leak raw passkey");

        // Submit correct passkey
        FinalPasskeyResponseDto correctRes = finalPasskeyService.submitFinalPasskey(p1A,
                FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build());

        assertEquals("COMPLETED", correctRes.getStatus());
        assertFalse(correctRes.toString().contains(rawPasskey), "Completion response must NOT leak raw passkey");
    }

    // ==========================================
    // 6. HTTP SECURITY HEADERS
    // ==========================================

    @Test
    @DisplayName("12. Security Headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) enforced")
    void testSecurityHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }
}
