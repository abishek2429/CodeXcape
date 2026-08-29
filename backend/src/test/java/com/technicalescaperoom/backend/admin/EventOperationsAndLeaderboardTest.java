package com.technicalescaperoom.backend.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.EventStatisticsDto;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.publicapi.PublicLeaderboardDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import com.technicalescaperoom.backend.service.admin.ResultExportService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class EventOperationsAndLeaderboardTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminAuditLogRepository adminAuditLogRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private ResultExportService resultExportService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event event;
    private Team team1Fast;
    private Team team2Slow;
    private Team team3Active;

    private Player player1;
    private GameSession session1;
    private AdminPrincipal organizerPrincipal;

    @BeforeEach
    void setUp() {
        event = eventRepository.save(Event.builder()
                .name("Phase 13 Leaderboard Event " + System.currentTimeMillis())
                .description("Operations Test")
                .status(EventStatus.RUNNING)
                .startTime(Instant.now().minusSeconds(3600))
                .passkeyHash(passwordEncoder.encode("849201"))
                .build());

        String suffix1 = System.currentTimeMillis() + "-T1-" + (int)(Math.random() * 10000);
        team1Fast = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-LDR-" + suffix1)
                .teamName("Fast Escape Team " + suffix1)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.COMPLETED)
                .completedAt(Instant.now().minusSeconds(1800)) // Completed 30m ago
                .build());

        player1 = playerRepository.save(Player.builder().team(team1Fast).playerNumber(1).displayName("P1 Fast").build());
        playerRepository.save(Player.builder().team(team1Fast).playerNumber(2).displayName("P2 Fast").build());
        gameStateService.initializeTeamGameState(team1Fast);

        // Mark team1Fast as COMPLETED for leaderboard testing
        team1Fast.setGameState(TeamGameState.COMPLETED);
        team1Fast.setCompletedAt(Instant.now().minusSeconds(1800));
        teamRepository.saveAndFlush(team1Fast);

        String token1 = "token-ldr-test-" + System.currentTimeMillis();
        session1 = gameSessionRepository.save(GameSession.builder()
                .player(player1)
                .team(team1Fast)
                .sessionToken(token1)
                .status(SessionStatus.ACTIVE)
                .build());

        String suffix2 = System.currentTimeMillis() + "-T2-" + (int)(Math.random() * 10000);
        team2Slow = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-LDR-" + suffix2)
                .teamName("Slow Escape Team " + suffix2)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerRepository.save(Player.builder().team(team2Slow).playerNumber(1).displayName("P1 Slow").build());
        playerRepository.save(Player.builder().team(team2Slow).playerNumber(2).displayName("P2 Slow").build());
        gameStateService.initializeTeamGameState(team2Slow);

        // Mark team2Slow as COMPLETED (later than team1Fast)
        team2Slow.setGameState(TeamGameState.COMPLETED);
        team2Slow.setCompletedAt(Instant.now().minusSeconds(600));
        teamRepository.saveAndFlush(team2Slow);

        String suffix3 = System.currentTimeMillis() + "-T3-" + (int)(Math.random() * 10000);
        team3Active = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-LDR-" + suffix3)
                .teamName("Active Team " + suffix3)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerRepository.save(Player.builder().team(team3Active).playerNumber(1).displayName("P1 Active").build());
        playerRepository.save(Player.builder().team(team3Active).playerNumber(2).displayName("P2 Active").build());
        gameStateService.initializeTeamGameState(team3Active);

        organizerPrincipal = AdminPrincipal.builder().username("lead_organizer").role(UserRole.ORGANIZER).build();
    }

    @Test
    @DisplayName("1. Verify server-authoritative leaderboard ranking (completed teams rank above incomplete, earlier completion ranks higher)")
    void testServerAuthoritativeLeaderboardRanking() {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(event.getId());

        assertNotNull(leaderboard);
        assertTrue(leaderboard.size() >= 3);

        // Rank #1: Fast Escape Team (completed earlier)
        LeaderboardEntryDto rank1 = leaderboard.get(0);
        assertEquals(1, rank1.getRank());
        assertEquals(team1Fast.getTeamCode(), rank1.getTeamCode());
        assertEquals(TeamGameState.COMPLETED, rank1.getGameState());
        assertNotNull(rank1.getFormattedDuration());

        // Rank #2: Slow Escape Team (completed later)
        LeaderboardEntryDto rank2 = leaderboard.get(1);
        assertEquals(2, rank2.getRank());
        assertEquals(team2Slow.getTeamCode(), rank2.getTeamCode());

        // Incomplete Team (Active Team) must NOT receive a rank position (rank == null)
        LeaderboardEntryDto activeEntry = leaderboard.stream()
                .filter(e -> e.getTeamCode().equals(team3Active.getTeamCode()))
                .findFirst().orElseThrow();
        assertNull(activeEntry.getRank(), "Incomplete teams must have null rank position.");
    }

    @Test
    @DisplayName("2. Verify Event Statistics calculation (registered, started, active, completed, fastest, level breakdown)")
    void testEventStatisticsCalculation() {
        EventStatisticsDto stats = leaderboardService.getEventStatistics(event.getId());

        assertNotNull(stats);
        assertEquals(event.getId(), stats.getEventId());
        assertTrue(stats.getTotalRegisteredTeams() >= 3);
        assertTrue(stats.getCompletedTeams() >= 2);
        assertNotNull(stats.getFormattedFastestCompletion());
        assertNotNull(stats.getLevelBreakdown());
        assertEquals(6, stats.getLevelBreakdown().size());
    }

    @Test
    @DisplayName("3. Verify Public Leaderboard payload (safe public projector display)")
    void testPublicLeaderboardSafety() {
        PublicLeaderboardDto publicLeaderboard = leaderboardService.getPublicLeaderboard(event.getId());

        assertNotNull(publicLeaderboard);
        assertFalse(publicLeaderboard.getCompletedEntries().isEmpty());

        String str = publicLeaderboard.toString();
        assertFalse(str.contains("849201"), "Raw passkey must NEVER appear in public leaderboard.");
        assertFalse(str.contains(event.getPasskeyHash()), "Passkey hash must NEVER appear in public leaderboard.");
    }

    @Test
    @DisplayName("4. Verify CSV Export generation (Event Results & Progress CSV)")
    void testCsvExportGeneration() {
        String resultsCsv = resultExportService.generateEventResultsCsv(organizerPrincipal, event.getId());
        assertNotNull(resultsCsv);
        assertTrue(resultsCsv.startsWith("Rank,Team Name,Player 1,Player 2,Status,Current Level,Completed At,Duration"));
        assertTrue(resultsCsv.contains(team1Fast.getTeamName()));

        String progressCsv = resultExportService.generateTeamProgressCsv(organizerPrincipal, event.getId());
        assertNotNull(progressCsv);
        assertTrue(progressCsv.startsWith("Team Code,Team Name,Player 1,Player 2,Status,Game State,Current Level,Completed At"));

        // Audit log created
        List<AdminAuditLog> logs = adminAuditLogRepository.findTop50ByOrderByCreatedAtDesc();
        assertFalse(logs.isEmpty());
        assertTrue(logs.stream().anyMatch(l -> l.getAction().equals("EXPORT_RESULTS_CSV")));
    }

    @Test
    @DisplayName("5. Verify Security: Player session receives 403 FORBIDDEN on admin export & results endpoints")
    void testPlayerDeniedAccessToAdminResultsAndExport() throws Exception {
        mockMvc.perform(get("/api/admin/events/" + event.getId() + "/export/results")
                        .header("X-Player-Session", session1.getSessionToken())
                        .accept(MediaType.TEXT_PLAIN))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/events/" + event.getId() + "/leaderboard")
                        .header("X-Player-Session", session1.getSessionToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. Verify Public Leaderboard endpoint /api/public/events/{eventId}/leaderboard is publicly accessible")
    void testPublicLeaderboardEndpointAccessible() throws Exception {
        mockMvc.perform(get("/api/public/events/" + event.getId() + "/leaderboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
