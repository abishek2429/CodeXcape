package com.technicalescaperoom.backend.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import com.technicalescaperoom.backend.service.admin.*;
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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AdminControlPanelTest {

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
    private HintRepository hintRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminAuditLogRepository adminAuditLogRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private AdminTeamResetService adminTeamResetService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;
    private GameSession sessionA1;

    private Team teamB;
    private Player playerB1;

    private AdminPrincipal adminPrincipal;
    private AdminPrincipal organizerPrincipal;

    @BeforeEach
    void setUp() {
        event = eventRepository.save(Event.builder()
                .name("Admin Control Panel Test Event " + System.currentTimeMillis())
                .description("Control Panel Test")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("849201"))
                .build());

        String suffixA = System.currentTimeMillis() + "-ADM1-" + (int)(Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-ADM-" + suffixA)
                .teamName("Admin Team A " + suffixA)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder().team(teamA).playerNumber(1).displayName("Admin P1A").build());
        playerA2 = playerRepository.save(Player.builder().team(teamA).playerNumber(2).displayName("Admin P2A").build());
        gameStateService.initializeTeamGameState(teamA);

        String tokenA1 = "token-admin-test-" + System.currentTimeMillis();
        sessionA1 = gameSessionRepository.save(GameSession.builder()
                .player(playerA1)
                .team(teamA)
                .sessionToken(tokenA1)
                .status(SessionStatus.ACTIVE)
                .build());

        String suffixB = System.currentTimeMillis() + "-ADM2-" + (int)(Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-ADM-" + suffixB)
                .teamName("Admin Team B " + suffixB)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder().team(teamB).playerNumber(1).displayName("Admin P1B").build());
        gameStateService.initializeTeamGameState(teamB);

        adminPrincipal = AdminPrincipal.builder().username("superadmin").role(UserRole.ADMIN).build();
        organizerPrincipal = AdminPrincipal.builder().username("leadorganizer").role(UserRole.ORGANIZER).build();
    }

    @Test
    @DisplayName("1. Verify Player session attempting to access /api/admin/* receives 403 FORBIDDEN")
    void testPlayerSessionDeniedAdminAccess() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + event.getId() + "/dashboard")
                        .header("X-Player-Session", sessionA1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("2. Verify Organizer header accessing /api/admin/* receives 200 OK")
    void testOrganizerAccessAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + event.getId() + "/dashboard")
                        .header("X-Admin-Role", "ORGANIZER")
                        .header("X-Admin-Username", "leadorganizer")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("3. Verify Event Lifecycle Controls (Start -> Pause -> Resume -> End)")
    void testEventLifecycleControls() {
        EventResponse startRes = adminEventControlService.updateEventStatus(organizerPrincipal, event.getId(), EventStatus.RUNNING);
        assertEquals(EventStatus.RUNNING, startRes.getStatus());

        EventResponse pauseRes = adminEventControlService.updateEventStatus(organizerPrincipal, event.getId(), EventStatus.PAUSED);
        assertEquals(EventStatus.PAUSED, pauseRes.getStatus());

        EventResponse resumeRes = adminEventControlService.updateEventStatus(organizerPrincipal, event.getId(), EventStatus.RUNNING);
        assertEquals(EventStatus.RUNNING, resumeRes.getStatus());

        EventResponse endRes = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.COMPLETED);
        assertEquals(EventStatus.COMPLETED, endRes.getStatus());
    }

    @Test
    @DisplayName("4. Verify Event Pause Status enforces gameplay freeze on answer submissions")
    void testEventPauseEnforcesGameplayFreeze() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);

        // Pause Event
        adminEventControlService.updateEventStatus(organizerPrincipal, event.getId(), EventStatus.PAUSED);

        assertThrows(EventUnavailableException.class, () -> {
            questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(1).answer("22").build());
        }, "Submitting answers while event is PAUSED must throw EventUnavailableException.");
    }

    @Test
    @DisplayName("5. Verify Dashboard Statistics calculation (totalTeams, activeTeams, completedTeams, levelDistribution)")
    void testDashboardStatsCalculation() {
        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(event.getId());

        assertNotNull(stats);
        assertEquals(event.getId(), stats.getEventId());
        assertTrue(stats.getTotalTeams() >= 2);
        assertNotNull(stats.getLevelDistribution());
        assertTrue(stats.getLevelDistribution().containsKey(1));
    }

    @Test
    @DisplayName("6. Verify Question & Hint Content updating by Organizer")
    void testQuestionAndHintContentManagement() {
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Hint hint = hintRepository.findByLevelIdAndIsActiveTrue(level1.getId()).orElseThrow();

        // Update Question
        Question updatedQuestion = adminContentService.updateQuestion(organizerPrincipal, question.getId(), "Updated SSH port question for testing?", "2222", AnswerType.NUMERIC, true);
        assertEquals("Updated SSH port question for testing?", updatedQuestion.getQuestionContent());
        assertEquals("2222", updatedQuestion.getExpectedAnswerHash());

        // Update Hint
        Hint updatedHint = adminContentService.updateHint(organizerPrincipal, hint.getId(), "Updated hint content for Level 1", true);
        assertEquals("Updated hint content for Level 1", updatedHint.getHintContent());
    }

    @Test
    @DisplayName("7. Verify Final Passkey configuration updating by Admin")
    void testUpdateFinalPasskey() {
        EventResponse response = adminEventControlService.updateEventPasskey(adminPrincipal, event.getId(), "999888");
        assertNotNull(response);

        Event updatedEvent = eventRepository.findById(event.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("999888", updatedEvent.getPasskeyHash()), "New passkey '999888' must match BCrypt hash.");
    }

    @Test
    @DisplayName("8. Verify isolated Team Reset (resets Team A without affecting Team B)")
    void testIsolatedTeamReset() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA);

        // Team A completes Level 1
        Level l1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        questionAnswerService.submitAnswer(p2A, AnswerSubmissionRequest.builder().levelNumber(1).answer(q2.getExpectedAnswerHash()).build());

        // Team A is on Level 2
        List<AdminTeamProgressDto> progressBefore = adminDashboardService.getTeamsProgress(event.getId(), teamA.getTeamCode(), null);
        assertEquals(1, progressBefore.size());
        assertEquals(2, progressBefore.get(0).getCurrentLevel());

        // Reset Team A
        adminTeamResetService.resetTeamProgress(organizerPrincipal, teamA.getId());

        // Team A is reset back to Level 1
        List<AdminTeamProgressDto> progressAfter = adminDashboardService.getTeamsProgress(event.getId(), teamA.getTeamCode(), null);
        assertEquals(1, progressAfter.size());
        assertEquals(1, progressAfter.get(0).getCurrentLevel());
        assertFalse(progressAfter.get(0).getPlayer1Completed());

        // Team B remains unaffected on Level 1
        List<AdminTeamProgressDto> progressB = adminDashboardService.getTeamsProgress(event.getId(), teamB.getTeamCode(), null);
        assertEquals(1, progressB.size());
        assertEquals(1, progressB.get(0).getCurrentLevel());
    }

    @Test
    @DisplayName("9. Verify Admin Audit Logging records organizer and admin actions")
    void testAdminAuditLogging() {
        adminEventControlService.updateEventStatus(organizerPrincipal, event.getId(), EventStatus.PAUSED);

        List<AdminAuditLog> logs = adminAuditLogRepository.findTop50ByOrderByCreatedAtDesc();
        assertFalse(logs.isEmpty());

        AdminAuditLog latestLog = logs.get(0);
        assertEquals("leadorganizer", latestLog.getAdminUsername());
        assertEquals("ORGANIZER", latestLog.getRole());
        assertEquals("UPDATE_EVENT_STATUS", latestLog.getAction());
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
                .sessionToken("test-admin-token-" + player.getId())
                .build();
    }
}
