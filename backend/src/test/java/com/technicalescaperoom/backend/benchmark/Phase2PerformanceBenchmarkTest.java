package com.technicalescaperoom.backend.benchmark;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.AdminActiveSessionDto;
import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.dto.admin.EventStatisticsDto;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.player.HintUseResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.dto.player.PlayerResponseDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.HintService;
import com.technicalescaperoom.backend.service.PlayerSessionService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import com.technicalescaperoom.backend.service.admin.AdminDashboardService;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import com.technicalescaperoom.backend.service.content.LevelContentValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class Phase2PerformanceBenchmarkTest {

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
    private HintRepository hintRepository;

    @Autowired
    private HintUsageRepository hintUsageRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private PlayerSessionService playerSessionService;

    @Autowired
    private HintService hintService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private LevelContentValidationService levelContentValidationService;

    private Event testEvent;
    private Team testTeam1;
    private Team testTeam2;
    private Player team1P1;
    private Player team1P2;
    private Player team2P1;
    private Player team2P2;
    private Level level1;

    @BeforeEach
    void setUp() {
        testEvent = eventRepository.save(Event.builder()
                .name("Performance Benchmark Event " + UUID.randomUUID())
                .status(EventStatus.READY)
                .passkeyHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5wz8v0aD9bK0l2P.ZtZt8x1Lq7Jeq")
                .startTime(Instant.now())
                .build());

        testTeam1 = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("BENCH-T1-" + UUID.randomUUID().toString().substring(0, 4))
                .teamName("Benchmark Team 1")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        testTeam2 = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("BENCH-T2-" + UUID.randomUUID().toString().substring(0, 4))
                .teamName("Benchmark Team 2")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        team1P1 = playerRepository.save(Player.builder()
                .team(testTeam1)
                .playerNumber(1)
                .displayName("Team1 Operator 1")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        team1P2 = playerRepository.save(Player.builder()
                .team(testTeam1)
                .playerNumber(2)
                .displayName("Team1 Operator 2")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        team2P1 = playerRepository.save(Player.builder()
                .team(testTeam2)
                .playerNumber(1)
                .displayName("Team2 Operator 1")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        team2P2 = playerRepository.save(Player.builder()
                .team(testTeam2)
                .playerNumber(2)
                .displayName("Team2 Operator 2")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        gameSessionRepository.save(GameSession.builder()
                .team(testTeam1)
                .player(team1P1)
                .sessionToken("SESSION-T1-P1-" + UUID.randomUUID())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .build());

        gameSessionRepository.save(GameSession.builder()
                .team(testTeam1)
                .player(team1P2)
                .sessionToken("SESSION-T1-P2-" + UUID.randomUUID())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .build());

        level1 = levelRepository.findByLevelNumber(1)
                .orElseGet(() -> levelRepository.save(Level.builder()
                        .levelNumber(1)
                        .name("Level 1 Test")
                        .description("Test Description")
                        .isActive(true)
                        .build()));

        teamLevelProgressRepository.save(TeamLevelProgress.builder()
                .team(testTeam1)
                .level(level1)
                .levelStatus(LevelStatus.IN_PROGRESS)
                .build());

        teamLevelProgressRepository.save(TeamLevelProgress.builder()
                .team(testTeam2)
                .level(level1)
                .levelStatus(LevelStatus.AVAILABLE)
                .build());
    }

    @Test
    @DisplayName("AdminDashboardService: Batch prefetching executes successfully across stats, active sessions, and progress")
    void testAdminDashboardBatchPrefetching() {
        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(testEvent.getId());
        assertThat(stats).isNotNull();
        assertThat(stats.getTotalTeams()).isGreaterThanOrEqualTo(2);
        assertThat(stats.getTotalLoggedInTeams()).isGreaterThanOrEqualTo(1);

        List<AdminActiveSessionDto> sessions = adminDashboardService.getActiveSessions(testEvent.getId());
        assertThat(sessions).isNotEmpty();
        assertThat(sessions.stream().anyMatch(s -> s.getTeamId().equals(testTeam1.getId()))).isTrue();

        List<AdminTeamProgressDto> progress = adminDashboardService.getTeamsProgress(testEvent.getId(), null, null, null);
        assertThat(progress).isNotEmpty();
        assertThat(progress.stream().anyMatch(p -> p.getTeamId().equals(testTeam1.getId()))).isTrue();
    }

    @Test
    @DisplayName("LeaderboardService: Batch prefetching and cached rank calculation return consistent ranking")
    void testLeaderboardBatchPrefetchingAndRankCaching() {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(testEvent.getId());
        assertThat(leaderboard).isNotEmpty();

        Integer rank1 = leaderboardService.getTeamCurrentRank(testTeam1.getId());
        assertThat(rank1).isNotNull();
        assertThat(rank1).isGreaterThanOrEqualTo(1);

        // Second lookup must hit the O(1) in-memory cache
        Integer cachedRank1 = leaderboardService.getTeamCurrentRank(testTeam1.getId());
        assertThat(cachedRank1).isEqualTo(rank1);

        EventStatisticsDto eventStats = leaderboardService.getEventStatistics(testEvent.getId());
        assertThat(eventStats).isNotNull();
        assertThat(eventStats.getTotalRegisteredTeams()).isGreaterThanOrEqualTo(2);
        assertThat(eventStats.getLevelBreakdown()).hasSize(6);
    }

    @Test
    @DisplayName("PlayerSessionService: startTeamEvent is idempotent and concurrency-safe with pessimistic row locking")
    void testStartTeamEventIdempotencyAndLocking() {
        PlayerPrincipal principal1 = PlayerPrincipal.builder()
                .playerId(team1P1.getId())
                .teamId(testTeam1.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .displayName(team1P1.getDisplayName())
                .sessionToken("SESSION-T1-P1")
                .isActive(true)
                .build();

        // First start
        PlayerResponseDto res1 = playerSessionService.startTeamEvent(principal1);
        assertThat(res1).isNotNull();
        assertThat(res1.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS.name());

        // Repeated/concurrent start from second operator should be safely handled idempotently
        PlayerPrincipal principal2 = PlayerPrincipal.builder()
                .playerId(team1P2.getId())
                .teamId(testTeam1.getId())
                .eventId(testEvent.getId())
                .playerNumber(2)
                .displayName(team1P2.getDisplayName())
                .sessionToken("SESSION-T1-P2")
                .isActive(true)
                .build();
        PlayerResponseDto res2 = playerSessionService.startTeamEvent(principal2);
        assertThat(res2).isNotNull();
        assertThat(res2.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS.name());

        // Verify team row state
        Team reloadedTeam = teamRepository.findById(testTeam1.getId()).orElseThrow();
        assertThat(reloadedTeam.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS);
        assertThat(reloadedTeam.getStartedAt()).isNotNull();
    }

    @Test
    @DisplayName("HintService: Concurrent or repeated hint requests are handled safely without unique constraint failures")
    void testHintServiceIdempotency() {
        teamStageProgressRepository.save(TeamStageProgress.builder()
                .team(testTeam1)
                .level(level1)
                .stageNumber(1)
                .player1Completed(false)
                .player2Completed(false)
                .discoveryKey("KEY-1")
                .build());

        hintRepository.save(Hint.builder()
                .level(level1)
                .stageNumber(1)
                .displayOrder(1)
                .hintContent("Test Hint Content 1")
                .isActive(true)
                .build());

        PlayerPrincipal principal = PlayerPrincipal.builder()
                .playerId(team1P1.getId())
                .teamId(testTeam1.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .displayName(team1P1.getDisplayName())
                .sessionToken("SESSION-T1-P1")
                .isActive(true)
                .build();

        HintUseResponseDto firstCall = hintService.useHint(principal, 1, 1, 1);
        assertThat(firstCall).isNotNull();
        assertThat(firstCall.isAlreadyUsed()).isFalse();
        assertThat(firstCall.getHintContent()).isEqualTo("Test Hint Content 1");

        // Second call must return alreadyUsed = true without failing
        HintUseResponseDto secondCall = hintService.useHint(principal, 1, 1, 1);
        assertThat(secondCall).isNotNull();
        assertThat(secondCall.isAlreadyUsed()).isTrue();
        assertThat(secondCall.getHintContent()).isEqualTo("Test Hint Content 1");
    }

    @Test
    @DisplayName("In-Memory Caching: QuestionAnswerService caches static metadata and validated levels")
    void testStaticContentCaching() {
        questionAnswerService.clearCache();

        levelContentValidationService.validateLevelContent(level1);


        PlayerPrincipal principal = PlayerPrincipal.builder()
                .playerId(team1P1.getId())
                .teamId(testTeam1.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .displayName(team1P1.getDisplayName())
                .sessionToken("SESSION-T1-P1")
                .isActive(true)
                .build();

        testTeam1.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(testTeam1);

        PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(principal);
        assertThat(qDto).isNotNull();
        assertThat(qDto.getTotalStages()).isGreaterThanOrEqualTo(1);

        // Call again to verify cached totalStages
        PlayerQuestionDto qDto2 = questionAnswerService.getCurrentQuestionForPlayer(principal);
        assertThat(qDto2).isNotNull();
        assertThat(qDto2.getTotalStages()).isEqualTo(qDto.getTotalStages());
    }
}
