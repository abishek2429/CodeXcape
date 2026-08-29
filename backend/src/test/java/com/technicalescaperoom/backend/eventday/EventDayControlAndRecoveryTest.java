package com.technicalescaperoom.backend.eventday;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.PlayerSessionService;
import com.technicalescaperoom.backend.service.admin.AdminDashboardService;
import com.technicalescaperoom.backend.service.admin.AdminEventControlService;
import com.technicalescaperoom.backend.service.admin.AdminTeamResetService;

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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class EventDayControlAndRecoveryTest {

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
    private AdminEventControlService adminEventControlService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private AdminTeamResetService adminTeamResetService;

    @Autowired
    private PlayerSessionService playerSessionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event testEvent;
    private AdminPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("admin_test", UserRole.ORGANIZER);

        testEvent = Event.builder()
                .name("CodeXcape Live 2026")
                .description("Phase 15 Event Control Test")
                .status(EventStatus.READY)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build();
        testEvent = eventRepository.save(testEvent);
    }

    @Test
    @DisplayName("Phase 15 - Event Lifecycle: Start, Pause, Resume, Emergency Stop, and End")
    void testEventLifecycleAndControls() {
        // 1. Start Event
        EventResponse startRes = adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);
        assertThat(startRes.getStatus()).isEqualTo(EventStatus.RUNNING);
        assertThat(startRes.getStartTime()).isNotNull();

        // 2. Pause Event
        EventResponse pauseRes = adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.PAUSED);
        assertThat(pauseRes.getStatus()).isEqualTo(EventStatus.PAUSED);

        // 3. Resume Event
        EventResponse resumeRes = adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);
        assertThat(resumeRes.getStatus()).isEqualTo(EventStatus.RUNNING);

        // 4. Emergency Stop
        EventResponse emergencyRes = adminEventControlService.emergencyStop(adminPrincipal, testEvent.getId(), "Network outage in Lab A");
        assertThat(emergencyRes.getStatus()).isEqualTo(EventStatus.PAUSED);

        // 5. End Event
        EventResponse endRes = adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.COMPLETED);
        assertThat(endRes.getStatus()).isEqualTo(EventStatus.COMPLETED);
        assertThat(endRes.getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("Phase 15 - Connection Matrix & Disconnected Players Monitoring")
    void testConnectionMatrixAndStats() {
        Team team = Team.builder()
                .event(testEvent)
                .teamCode("P15T1")
                .teamName("Alpha Coders")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.IN_PROGRESS)
                .createdAt(Instant.now())
                .build();
        team = teamRepository.save(team);

        Player p1 = playerRepository.save(Player.builder().team(team).playerNumber(1).displayName("Alice").status(PlayerStatus.CONNECTED).createdAt(Instant.now()).build());
        Player p2 = playerRepository.save(Player.builder().team(team).playerNumber(2).displayName("Bob").status(PlayerStatus.DISCONNECTED).createdAt(Instant.now()).build());

        // Create Sessions
        gameSessionRepository.save(GameSession.builder().team(team).player(p1).sessionToken(UUID.randomUUID().toString()).status(SessionStatus.ACTIVE).isConnected(true).createdAt(Instant.now()).lastActivityAt(Instant.now()).build());
        gameSessionRepository.save(GameSession.builder().team(team).player(p2).sessionToken(UUID.randomUUID().toString()).status(SessionStatus.TERMINATED).isConnected(false).createdAt(Instant.now()).lastActivityAt(Instant.now()).build());

        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(testEvent.getId());

        assertThat(stats.getTotalTeams()).isEqualTo(1);
        assertThat(stats.getOnePlayerOfflineTeams()).isEqualTo(1);
        assertThat(stats.getDisconnectedPlayers()).isEqualTo(1);

        List<AdminTeamProgressDto> progress = adminDashboardService.getTeamsProgress(testEvent.getId(), null, null, null);
        assertThat(progress).hasSize(1);
        assertThat(progress.get(0).getPlayer1Connected()).isTrue();
        assertThat(progress.get(0).getPlayer2Connected()).isFalse();
        assertThat(progress.get(0).getConnectionStatus()).isEqualTo("ONE_OFFLINE");
    }

    @Test
    @DisplayName("Phase 15 - Player Session Revocation")
    void testPlayerSessionRevocation() {
        Team team = teamRepository.save(Team.builder().event(testEvent).teamCode("REV1").teamName("Revoke Team").status(TeamStatus.REGISTERED).gameState(TeamGameState.IN_PROGRESS).createdAt(Instant.now()).build());
        Player p1 = playerRepository.save(Player.builder().team(team).playerNumber(1).displayName("Carol").status(PlayerStatus.CONNECTED).createdAt(Instant.now()).build());

        GameSession session = gameSessionRepository.save(GameSession.builder().team(team).player(p1).sessionToken(UUID.randomUUID().toString()).status(SessionStatus.ACTIVE).isConnected(true).createdAt(Instant.now()).lastActivityAt(Instant.now()).build());

        // Admin revokes session
        playerSessionService.revokeSession(adminPrincipal, session.getId());

        GameSession updatedSession = gameSessionRepository.findById(session.getId()).orElseThrow();
        assertThat(updatedSession.getStatus()).isEqualTo(SessionStatus.TERMINATED);
        assertThat(updatedSession.getIsConnected()).isFalse();

        Player updatedPlayer = playerRepository.findById(p1.getId()).orElseThrow();
        assertThat(updatedPlayer.getStatus()).isEqualTo(PlayerStatus.DISCONNECTED);
    }

    @Test
    @DisplayName("Phase 15 - Complete 40-Team Event Simulation Test")
    void test40TeamEventSimulation() {
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);

        for (int i = 1; i <= 40; i++) {
            Team t = teamRepository.save(Team.builder()
                    .event(testEvent)
                    .teamCode("SIM" + String.format("%02d", i))
                    .teamName("Sim Team " + i)
                    .status(TeamStatus.REGISTERED)
                    .gameState(i <= 10 ? TeamGameState.COMPLETED : TeamGameState.IN_PROGRESS)
                    .completedAt(i <= 10 ? Instant.now() : null)
                    .createdAt(Instant.now())
                    .build());

            Player p1 = playerRepository.save(Player.builder().team(t).playerNumber(1).displayName("P1_" + i).status(PlayerStatus.CONNECTED).createdAt(Instant.now()).build());
            Player p2 = playerRepository.save(Player.builder().team(t).playerNumber(2).displayName("P2_" + i).status(PlayerStatus.CONNECTED).createdAt(Instant.now()).build());

            gameSessionRepository.save(GameSession.builder().team(t).player(p1).sessionToken(UUID.randomUUID().toString()).status(SessionStatus.ACTIVE).isConnected(true).createdAt(Instant.now()).lastActivityAt(Instant.now()).build());
            gameSessionRepository.save(GameSession.builder().team(t).player(p2).sessionToken(UUID.randomUUID().toString()).status(SessionStatus.ACTIVE).isConnected(true).createdAt(Instant.now()).lastActivityAt(Instant.now()).build());
        }

        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(testEvent.getId());
        assertThat(stats.getTotalTeams()).isEqualTo(40);
        assertThat(stats.getCompletedTeams()).isEqualTo(10);
        assertThat(stats.getActiveTeams()).isEqualTo(30);
        assertThat(stats.getBothPlayersOnlineTeams()).isEqualTo(40);

        // Emergency Stop & End Event
        adminEventControlService.emergencyStop(adminPrincipal, testEvent.getId(), "Simulation complete");
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.COMPLETED);

        Event finalEvent = eventRepository.findById(testEvent.getId()).orElseThrow();
        assertThat(finalEvent.getStatus()).isEqualTo(EventStatus.COMPLETED);
    }
}
