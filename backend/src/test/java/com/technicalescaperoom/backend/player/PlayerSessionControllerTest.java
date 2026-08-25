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

import static org.hamcrest.Matchers.*;
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
                .build());

        team17Player1 = playerRepository.save(Player.builder()
                .team(team17)
                .playerNumber(1)
                .displayName("Alice (Operator)")
                .status(PlayerStatus.INACTIVE)
                .build());

        team17Player2 = playerRepository.save(Player.builder()
                .team(team17)
                .playerNumber(2)
                .displayName("Bob (Analyzer)")
                .status(PlayerStatus.INACTIVE)
                .build());

        // Create Team 018
        team18 = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("TEAM-018")
                .teamName("Shadow Hackers")
                .status(TeamStatus.REGISTERED)
                .build());

        team18Player1 = playerRepository.save(Player.builder()
                .team(team18)
                .playerNumber(1)
                .displayName("Charlie")
                .status(PlayerStatus.INACTIVE)
                .build());
    }

    @Test
    @DisplayName("1. Successful login for Player 1 creates active session and returns cookie")
    void testSuccessfulLoginPlayer1() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder()
                .teamCode("TEAM-017")
                .playerNumber(1)
                .build();

        mockMvc.perform(post("/api/player/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(PlayerSessionAuthenticationFilter.COOKIE_NAME))
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")))
                .andExpect(jsonPath("$.status", is("CONNECTED")));
    }

    @Test
    @DisplayName("2. Successful login for Player 2 on same team creates independent active session")
    void testSuccessfulLoginPlayer2Independent() throws Exception {
        // Player 1 logs in
        PlayerLoginRequest loginP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(loginP1)))
                .andExpect(status().isOk());

        // Player 2 logs in independently
        PlayerLoginRequest loginP2 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(2).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(loginP2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(2)))
                .andExpect(jsonPath("$.playerName", is("Bob (Analyzer)")));
    }

    @Test
    @DisplayName("3. Reject login with invalid team code")
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
    @DisplayName("4. Reject login with invalid player number")
    void testInvalidPlayerNumberRejection() throws Exception {
        // Request player number 2 for team 18 which only has player 1 registered
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
    @DisplayName("5. Reject login when event is DRAFT/paused/not accepting players")
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

    @Test
    @DisplayName("6. Reject duplicate login attempt for Player 1 from second computer")
    void testDuplicateLoginRejection() throws Exception {
        // Player 1 logs in from Computer A
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Computer B attempts duplicate login without valid session token
        mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already connected from another computer")));
    }

    @Test
    @DisplayName("7. Reconnection succeeds if request carries existing valid session token")
    void testReconnectionSucceeds() throws Exception {
        // Initial login
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.COOKIE_NAME);

        // Reconnect with valid cookie
        mockMvc.perform(post("/api/player/login")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.status", is("CONNECTED")));
    }

    @Test
    @DisplayName("8. Authenticated GET /api/player/me returns current player identity")
    void testGetPlayerMeAuthenticated() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.COOKIE_NAME);

        mockMvc.perform(get("/api/player/me").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")));
    }

    @Test
    @DisplayName("9. Unauthenticated GET /api/player/me is rejected with 401")
    void testGetPlayerMeUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/player/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("10. Logout invalidates session and subsequent /api/player/me calls fail")
    void testLogoutInvalidatesSession() throws Exception {
        PlayerLoginRequest request = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var result = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie(PlayerSessionAuthenticationFilter.COOKIE_NAME);

        // Perform logout
        mockMvc.perform(post("/api/player/logout").cookie(sessionCookie))
                .andExpect(status().isOk());

        // Subsequent GET /api/player/me should fail with 401
        mockMvc.perform(get("/api/player/me").cookie(sessionCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("11. Expired session is rejected with 401 on protected endpoint")
    void testExpiredSessionRejection() throws Exception {
        // Create an expired session in DB
        GameSession expiredSession = gameSessionRepository.save(GameSession.builder()
                .team(team17)
                .player(team17Player1)
                .sessionToken("EXPIRED-TOKEN-123")
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now().minusSeconds(7200))
                .lastActivityAt(Instant.now().minusSeconds(7200))
                .build());

        Cookie expiredCookie = new Cookie(PlayerSessionAuthenticationFilter.COOKIE_NAME, "EXPIRED-TOKEN-123");

        mockMvc.perform(get("/api/player/me").cookie(expiredCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("SESSION_EXPIRED")));
    }

    @Test
    @DisplayName("12. Team and Player Isolation: Authenticated session returns only own player details")
    void testTeamAndPlayerIsolation() throws Exception {
        // Login Team 17 Player 1
        PlayerLoginRequest requestP1 = PlayerLoginRequest.builder().teamCode("TEAM-017").playerNumber(1).build();
        var resP1 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(requestP1)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP1 = resP1.getResponse().getCookie(PlayerSessionAuthenticationFilter.COOKIE_NAME);

        // Login Team 18 Player 1
        PlayerLoginRequest requestP18 = PlayerLoginRequest.builder().teamCode("TEAM-018").playerNumber(1).build();
        var resP18 = mockMvc.perform(post("/api/player/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(requestP18)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookieP18 = resP18.getResponse().getCookie(PlayerSessionAuthenticationFilter.COOKIE_NAME);

        // Verify Team 17 Cookie receives ONLY Team 17 Player 1
        mockMvc.perform(get("/api/player/me").cookie(cookieP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-017")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Alice (Operator)")));

        // Verify Team 18 Cookie receives ONLY Team 18 Player 1
        mockMvc.perform(get("/api/player/me").cookie(cookieP18))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamCode", is("TEAM-018")))
                .andExpect(jsonPath("$.playerNumber", is(1)))
                .andExpect(jsonPath("$.playerName", is("Charlie")));
    }
}
