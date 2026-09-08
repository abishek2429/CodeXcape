package com.technicalescaperoom.backend.player;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.config.security.PlayerSessionAuthenticationFilter;
import com.technicalescaperoom.backend.dto.player.PlayerLoginRequest;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class PlayerSessionControllerTest {

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
    private GameSessionRepository gameSessionRepository;

    private Event testEvent;
    private Team team17;
    private Team team18;
    private Player team17Player1;
    private Player team17Player2;
    private Player team18Player1;

    @BeforeEach
    void setUp() {
        // Clean game sessions
        gameSessionRepository.deleteAll();

        // Create Ready Event
        testEvent = eventRepository.save(Event.builder()
                .name("Technical Escape Room 2026")
                .description("Test Event")
                .status(EventStatus.READY)
                .passkeyHash("hash123")
                .build());

        // Create Team 017
        team17 = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-017")
                .teamName("Cyber Warriors")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        team17Player1 = playerRepository.save(Player.builder()
                .team(team17)
                .playerNumber(1)
                .displayName("Alice (Operator)")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        team17Player2 = playerRepository.save(Player.builder()
                .team(team17)
                .playerNumber(2)
                .displayName("Bob (Analyzer)")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());

        // Create Team 018
        team18 = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-018")
                .teamName("Shadow Hackers")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        team18Player1 = playerRepository.save(Player.builder()
                .team(team18)
                .playerNumber(1)
                .displayName("Charlie")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .build());
    }

    @Test
    @DisplayName("1. Successful login for Player 1 creates active session, returns cookie, and isActive: true")
    void testSuccessfulLoginPlayer1() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder()
                .teamCode("TEAM-017")
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME))
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")))
                .andExpect(jsonPath("$.status", is("CONNECTED")))
                .andExpect(jsonPath("$.isActive", is(true)));
    }

    @Test
    @DisplayName("2. Successful login for Player 2 on same team creates independent active session")
    void testSuccessfulLoginPlayer2Independent() throws Exception {
        PlayerLoginRequest loginP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(loginP1)))
                .andExpect(status().isOk());

        PlayerLoginRequest loginP2 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(2).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(loginP2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(2)))
                .andExpect(jsonPath("$.playerName", is("Bob (Analyzer)")))
                .andExpect(jsonPath("$.isActive", is(true)));

        assertEquals(2, gameSessionRepository.findByStatus(SessionStatus.ACTIVE).size());
    }

    @Test
    @DisplayName("3. Repeated logins before event starts rotate session and succeed without 409 Conflict")
    void testRepeatedLoginBeforeEventStartsAllowed() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();

        // First login
        var result1 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookie1 = result1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);
        assertNotNull(cookie1);

        // Second login from another tab/browser without sending cookie1
        var result2 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONNECTED")))
                .andExpect(jsonPath("$.isActive", is(true)))
                .andReturn();
        Cookie cookie2 = result2.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);
        assertNotNull(cookie2);
        assertNotEquals(cookie1.getValue(), cookie2.getValue());

        // Old session was terminated cleanly
        GameSession oldSession = gameSessionRepository.findBySessionToken(cookie1.getValue()).orElseThrow();
        assertEquals(SessionStatus.TERMINATED, oldSession.getStatus());
        assertFalse(oldSession.getIsConnected());

        // New session is active
        GameSession newSession = gameSessionRepository.findBySessionToken(cookie2.getValue()).orElseThrow();
        assertEquals(SessionStatus.ACTIVE, newSession.getStatus());
        assertTrue(newSession.getIsConnected());
    }

    @Test
    @DisplayName("4. Repeated login during active gameplay rotates session, preserves startedAt, and succeeds")
    void testRepeatedLoginDuringActiveEventAllowed() throws Exception {
        // Set team in progress
        Instant initialStartTime = Instant.now().minusSeconds(300);
        team17.setGameState(TeamGameState.IN_PROGRESS);
        team17.setStartedAt(initialStartTime);
        teamRepository.save(team17);

        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();

        // First login during gameplay
        var result1 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameState", is("IN_PROGRESS")))
                .andReturn();
        Cookie cookie1 = result1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Repeated login during gameplay (e.g. browser crash or device switch)
        var result2 = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameState", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.eventStartedAt", notNullValue()))
                .andExpect(jsonPath("$.isActive", is(true)))
                .andReturn();
        Cookie cookie2 = result2.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);
        assertNotEquals(cookie1.getValue(), cookie2.getValue());

        // Team start time preserved
        Team reloadedTeam = teamRepository.findById(team17.getId()).orElseThrow();
        assertEquals(TeamGameState.IN_PROGRESS, reloadedTeam.getGameState());
        assertEquals(initialStartTime.toEpochMilli(), reloadedTeam.getStartedAt().toEpochMilli());
    }

    @Test
    @DisplayName("5. Deactivated player account (isActive = false) is rejected at login with 403 Forbidden")
    void testAccountEligibilityDeactivatedPlayerRejected() throws Exception {
        team17Player1.setIsActive(false);
        playerRepository.save(team17Player1);

        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Player account is deactivated or ineligible")));
    }

    @Test
    @DisplayName("6. Active session of deactivated player is rejected with 403 on protected endpoint")
    void testDeactivatedPlayerTokenRejectedOnProtectedEndpoint() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Account is subsequently deactivated
        team17Player1.setIsActive(false);
        playerRepository.save(team17Player1);

        mockMvc.perform(get("/api/player/me").cookie(cookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("ACCOUNT_DISABLED")));
    }

    @Test
    @DisplayName("7. Event start succeeds authoritatively when both players are connected and ready")
    void testEventStartAuthoritativeWithBothPlayersReady() throws Exception {
        // Player 1 logs in
        PlayerLoginRequest reqP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var resP1 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP1)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP1 = resP1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Player 2 logs in and marks ready
        PlayerLoginRequest reqP2 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(2).build();
        var resP2 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP2)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP2 = resP2.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        mockMvc.perform(post("/api/player/ready")
                        .cookie(cookieP2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("ready", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isReady", is(true)));

        // Player 1 initiates start
        mockMvc.perform(post("/api/player/event/start").cookie(cookieP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameState", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.eventStartedAt", notNullValue()));

        Team updatedTeam = teamRepository.findById(team17.getId()).orElseThrow();
        assertEquals(TeamGameState.IN_PROGRESS, updatedTeam.getGameState());
        assertNotNull(updatedTeam.getStartedAt());
    }

    @Test
    @DisplayName("8. Multiple calls to start event are idempotent and retain original startedAt")
    void testEventStartIdempotent() throws Exception {
        PlayerLoginRequest reqP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var resP1 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP1)))
                .andExpect(status().isOk()).andReturn();
        Cookie cookieP1 = resP1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        PlayerLoginRequest reqP2 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(2).build();
        var resP2 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP2)))
                .andExpect(status().isOk()).andReturn();
        Cookie cookieP2 = resP2.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        mockMvc.perform(post("/api/player/ready").cookie(cookieP2).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(Map.of("ready", true))))
                .andExpect(status().isOk());

        // First start
        mockMvc.perform(post("/api/player/event/start").cookie(cookieP1))
                .andExpect(status().isOk());

        Team teamAfterFirstStart = teamRepository.findById(team17.getId()).orElseThrow();
        Instant firstStartedAt = teamAfterFirstStart.getStartedAt();
        assertNotNull(firstStartedAt);

        // Second start attempt (idempotent)
        mockMvc.perform(post("/api/player/event/start").cookie(cookieP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameState", is("IN_PROGRESS")));

        Team teamAfterSecondStart = teamRepository.findById(team17.getId()).orElseThrow();
        assertEquals(firstStartedAt, teamAfterSecondStart.getStartedAt());
    }

    @Test
    @DisplayName("9. Event start fails if second operator is not ready")
    void testEventStartFailsIfTeammateNotReady() throws Exception {
        // Player 1 logs in
        PlayerLoginRequest reqP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var resP1 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP1)))
                .andExpect(status().isOk()).andReturn();
        Cookie cookieP1 = resP1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Player 2 logs in but DOES NOT mark ready
        PlayerLoginRequest reqP2 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(2).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reqP2)))
                .andExpect(status().isOk());

        // Player 1 attempts to start
        mockMvc.perform(post("/api/player/event/start").cookie(cookieP1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("WAITING FOR SECOND OPERATOR")));
    }

    @Test
    @DisplayName("10. Reconnection succeeds if request carries existing valid session token")
    void testReconnectionWithValidSessionToken() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        mockMvc.perform(post("/api/player/login")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.status", is("CONNECTED")));

        assertEquals(1, gameSessionRepository.findByStatus(SessionStatus.ACTIVE).size());
    }

    @Test
    @DisplayName("11. Authenticated GET /api/player/me returns player identity and isActive: true")
    void testAuthenticatedGetPlayerMe() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        mockMvc.perform(get("/api/player/me").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")))
                .andExpect(jsonPath("$.isActive", is(true)));
    }

    @Test
    @DisplayName("12. Unauthenticated GET /api/player/me is rejected with 401")
    void testUnauthenticatedGetPlayerMeRejected() throws Exception {
        mockMvc.perform(get("/api/player/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("13. Logout invalidates session but preserves game state and account eligibility")
    void testLogoutInvalidatesSessionPreservesGameState() throws Exception {
        // Set event in progress
        team17.setGameState(TeamGameState.IN_PROGRESS);
        team17.setStartedAt(Instant.now().minusSeconds(100));
        teamRepository.save(team17);

        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Player logs out
        mockMvc.perform(post("/api/player/logout").cookie(sessionCookie))
                .andExpect(status().isOk());

        // Subsequent GET /api/player/me should fail with 401
        mockMvc.perform(get("/api/player/me").cookie(sessionCookie))
                .andExpect(status().isUnauthorized());

        // Team state and player isActive remain completely preserved
        Team reloadedTeam = teamRepository.findById(team17.getId()).orElseThrow();
        assertEquals(TeamGameState.IN_PROGRESS, reloadedTeam.getGameState());
        assertNotNull(reloadedTeam.getStartedAt());

        Player reloadedPlayer = playerRepository.findById(team17Player1.getId()).orElseThrow();
        assertTrue(reloadedPlayer.getIsActive());
    }

    @Test
    @DisplayName("14. Expired session is rejected with 401 on protected endpoint")
    void testExpiredSessionRejected() throws Exception {
        GameSession expiredSession = gameSessionRepository.save(GameSession.builder()
                .team(team17)
                .player(team17Player1)
                .sessionToken("EXPIRED-TOKEN-123")
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now().minusSeconds(7200))
                .lastActivityAt(Instant.now().minusSeconds(7200))
                .build());

        Cookie expiredCookie = new Cookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME, "EXPIRED-TOKEN-123");

        mockMvc.perform(get("/api/player/me").cookie(expiredCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("SESSION_EXPIRED")));
    }

    @Test
    @DisplayName("15. Team and Player Isolation: Authenticated session returns only own player details")
    void testTeamAndPlayerIsolation() throws Exception {
        // Login Team 17 Player 1
        PlayerLoginRequest requestP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var resP1 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(requestP1)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP1 = resP1.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Login Team 18 Player 1
        PlayerLoginRequest requestP18 = PlayerLoginRequest.builder().teamCode("TEAM-018").playerNumber(1).build();
        var resP18 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(requestP18)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP18 = resP18.getResponse().getCookie(PlayerSessionAuthenticationFilter.PLAYER_COOKIE_NAME);

        // Verify Team 17 Cookie receives ONLY Team 17 Player 1
        mockMvc.perform(get("/api/player/me").cookie(cookieP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")))
                .andExpect(jsonPath("$.isActive", is(true)));

        // Verify Team 18 Cookie receives ONLY Team 18 Player 1
        mockMvc.perform(get("/api/player/me").cookie(cookieP18))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-018")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Charlie")))
                .andExpect(jsonPath("$.isActive", is(true)));
    }

    // Supplementary validation tests
    @Test
    @DisplayName("Supplementary: Reject login with invalid team code")
    void testInvalidTeamCodeRejection() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder()
                .teamCode("NON-EXISTENT-TEAM")
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Team not found")));
    }

    @Test
    @DisplayName("Supplementary: Reject login with invalid player number")
    void testInvalidPlayerNumberRejection() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder()
                .teamCode("TEAM-018")
                .playerNumber(2)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Selected player is not registered")));
    }

    @Test
    @DisplayName("Supplementary: Reject login when event is DRAFT/paused")
    void testEventUnavailableRejection() throws Exception {
        testEvent.setStatus(EventStatus.DRAFT);
        eventRepository.save(testEvent);

        PlayerLoginRequest request = PlayerLoginRequest.builder()
                .teamCode("TEAM-017")
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("The event is not currently accepting players")));
    }
}
