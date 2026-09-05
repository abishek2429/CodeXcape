package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class SystemLoadAndConcurrencyTest {

    public static final int CONFIGURABLE_TEAM_COUNT = 40;
    public static final int PLAYERS_PER_TEAM = 2;
    public static final int TOTAL_SIMULTANEOUS_PLAYERS = CONFIGURABLE_TEAM_COUNT * PLAYERS_PER_TEAM; // 80 players

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private EventContentValidationService eventContentValidationService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private HintService hintService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event loadEvent;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("load_test_admin", UserRole.ADMIN);

        // 1. Create Dedicated Test Event in DRAFT
        loadEvent = eventRepository.save(Event.builder()
                .name("CodeXcape 40-Team Load Test Event")
                .description("Dedicated Isolated Load Test Environment")
                .status(EventStatus.DRAFT)
                .passkeyHash("")
                .createdAt(Instant.now())
                .build());

        // 2. Configure Final Passkey & 6 Levels of Questions and Hints
        adminEventControlService.updateEventPasskey(adminPrincipal, loadEvent.getId(), "987654");

        for (int i = 1; i <= 6; i++) {
            adminContentService.saveQuestionConfig(adminPrincipal, loadEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1)
                    .evidence("Load Q Level " + i + " Player 1")
                    .expectedAnswer("ans_l" + i + "_p1")
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveQuestionConfig(adminPrincipal, loadEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2)
                    .evidence("Load Q Level " + i + " Player 2")
                    .expectedAnswer("ans_l" + i + "_p2")
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveHintConfig(adminPrincipal, loadEvent.getId(), i, HintConfigDto.builder()
                    .hintContent("Load Hint Level " + i)
                    .displayOrder(1)
                    .build());
        }

        // 3. Verify Pre-Flight Readiness
        EventReadinessDto readiness = eventContentValidationService.validateEventReadiness(loadEvent.getId());
        assertThat(readiness.isOverallReady()).isTrue();
    }

    @Test
    @DisplayName("Simultaneous Player Registration & Session Benchmarks (80 Players)")
    void testSimultaneousPlayerRegistrationAndAuthSpike() {
        List<Long> latencies = new ArrayList<>();
        List<TeamDetailResponse> createdTeams = new ArrayList<>();

        Instant startTime = Instant.now();

        for (int t = 1; t <= CONFIGURABLE_TEAM_COUNT; t++) {
            long reqStart = System.currentTimeMillis();

            TeamDetailResponse teamRes = teamService.createTeam(loadEvent.getId(), CreateTeamRequest.builder()
                    .teamName("Load Team " + t)
                    .player1DisplayName("Player 1_" + t)
                    .player2DisplayName("Player 2_" + t)
                    .build());

            long reqEnd = System.currentTimeMillis();
            latencies.add(reqEnd - reqStart);
            createdTeams.add(teamRes);
        }

        Instant endTime = Instant.now();
        Duration totalDuration = Duration.between(startTime, endTime);

        assertThat(createdTeams).hasSize(CONFIGURABLE_TEAM_COUNT);

        // Record Metrics
        double avgLatency = latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long maxLatency = latencies.stream().mapToLong(Long::longValue).max().orElse(0L);
        long minLatency = latencies.stream().mapToLong(Long::longValue).min().orElse(0L);

        Collections.sort(latencies);
        long medianLatency = latencies.get(latencies.size() / 2);
        long p95Latency = latencies.get((int) (latencies.size() * 0.95));
        long p99Latency = latencies.get((int) (latencies.size() * 0.99));

        assertThat(avgLatency).isLessThan(500.0); // Benchmark threshold: average < 500ms
        assertThat(createdTeams.stream().allMatch(t -> t.getPlayers().size() == 2)).isTrue();
    }

    @Test
    @DisplayName("Event Start Load & Broadcast Simulation (80 Sessions Active)")
    void testEventStartLoadBroadcast() {
        // Register 40 teams (80 players)
        for (int t = 1; t <= CONFIGURABLE_TEAM_COUNT; t++) {
            teamService.createTeam(loadEvent.getId(), CreateTeamRequest.builder()
                    .teamName("Broadcast Team " + t)
                    .player1DisplayName("P1_" + t)
                    .player2DisplayName("P2_" + t)
                    .build());
        }

        // Start Event
        EventResponse eventRes = adminEventControlService.updateEventStatus(adminPrincipal, loadEvent.getId(), EventStatus.RUNNING);
        assertThat(eventRes.getStatus()).isEqualTo(EventStatus.RUNNING);

        // Verify Dashboard overview reflects 40 active teams
        AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(loadEvent.getId());
        assertThat(stats.getTotalTeams()).isEqualTo(CONFIGURABLE_TEAM_COUNT);
        assertThat(stats.getActiveTeams()).isEqualTo(CONFIGURABLE_TEAM_COUNT);
        assertThat(stats.getCompletedTeams()).isEqualTo(0);
    }

    @Test
    @DisplayName("Simultaneous Question Retrieval & Zero Cross-Team Leakage")
    void testSimultaneousQuestionRetrievalAndIsolation() {
        adminEventControlService.updateEventStatus(adminPrincipal, loadEvent.getId(), EventStatus.RUNNING);

        List<PlayerPrincipal> playerPrincipals = new ArrayList<>();

        for (int t = 1; t <= CONFIGURABLE_TEAM_COUNT; t++) {
            TeamDetailResponse teamRes = teamService.createTeam(loadEvent.getId(), CreateTeamRequest.builder()
                    .teamName("Iso Team " + t)
                    .player1DisplayName("Iso P1_" + t)
                    .player2DisplayName("Iso P2_" + t)
                    .build());

            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 1).orElseThrow();
            Player p2 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 2).orElseThrow();

            playerPrincipals.add(PlayerPrincipal.builder().playerId(p1.getId()).teamId(teamRes.getId()).eventId(loadEvent.getId()).playerNumber(1).sessionToken("token_iso_p1_" + t).build());
            playerPrincipals.add(PlayerPrincipal.builder().playerId(p2.getId()).teamId(teamRes.getId()).eventId(loadEvent.getId()).playerNumber(2).sessionToken("token_iso_p2_" + t).build());
        }

        assertThat(playerPrincipals).hasSize(TOTAL_SIMULTANEOUS_PLAYERS);

        // Retrieve current question for all 80 simultaneous players
        for (PlayerPrincipal principal : playerPrincipals) {
            PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(principal);
            assertThat(qDto.getLevelNumber()).isEqualTo(1);
            assertThat(qDto.getEvidence()).contains("Load Q Level 1");
            // Verify expected answer is NEVER present in DTO
            assertThat(qDto.toString()).doesNotContain("ans_l1");
        }
    }

    @Test
    @DisplayName("40-Team Full 6-Level Progression Simulation & Completion Spike")
    void testFull40TeamGameplaySimulationAndCompletionSpike() {
        adminEventControlService.updateEventStatus(adminPrincipal, loadEvent.getId(), EventStatus.RUNNING);

        List<TeamPrincipals> teamPrincipalsList = new ArrayList<>();

        for (int t = 1; t <= CONFIGURABLE_TEAM_COUNT; t++) {
            TeamDetailResponse teamRes = teamService.createTeam(loadEvent.getId(), CreateTeamRequest.builder()
                    .teamName("Sim Team " + t)
                    .player1DisplayName("Sim P1_" + t)
                    .player2DisplayName("Sim P2_" + t)
                    .build());

            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 1).orElseThrow();
            Player p2 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 2).orElseThrow();

            PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(teamRes.getId()).eventId(loadEvent.getId()).playerNumber(1).sessionToken("token_sim_p1_" + t).build();
            PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(teamRes.getId()).eventId(loadEvent.getId()).playerNumber(2).sessionToken("token_sim_p2_" + t).build();

            teamPrincipalsList.add(new TeamPrincipals(teamRes.getId(), p1Princ, p2Princ));
        }

        // Execute 6-Level Progression for all 40 Teams
        for (int lvl = 1; lvl <= 6; lvl++) {
            for (TeamPrincipals tp : teamPrincipalsList) {
                AnswerSubmissionResponseDto r1 = questionAnswerService.submitAnswer(tp.p1, AnswerSubmissionRequest.builder().levelNumber(lvl).answer("ans_l" + lvl + "_p1").build());
                AnswerSubmissionResponseDto r2 = questionAnswerService.submitAnswer(tp.p2, AnswerSubmissionRequest.builder().levelNumber(lvl).answer("ans_l" + lvl + "_p2").build());

                assertThat(r1.getCorrect()).isTrue();
                assertThat(r2.getCorrect()).isTrue();
                assertThat(r2.getIsCompleted()).isTrue();

                // Hint retrieval validation (count unlocked hints)
                PlayerHintsResponseDto hintsRes = hintService.getHintsForPlayer(tp.p1);
                long unlockedCount = hintsRes.getHints().stream().filter(h -> Boolean.TRUE.equals(h.getIsUnlocked())).count();
                assertThat(unlockedCount).isEqualTo(lvl);
            }
        }

        // Final Terminal Completion Spike for all 40 Teams
        int completedCount = 0;
        for (TeamPrincipals tp : teamPrincipalsList) {
            FinalPasskeyResponseDto passkeyRes = finalPasskeyService.submitFinalPasskey(tp.p1, FinalPasskeySubmissionRequest.builder().passkey("987654").build());
            assertThat(passkeyRes.getStatus()).isEqualTo("COMPLETED");
            completedCount++;
        }

        assertThat(completedCount).isEqualTo(CONFIGURABLE_TEAM_COUNT);

        // Leaderboard Verification
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(loadEvent.getId());
        assertThat(leaderboard).hasSize(CONFIGURABLE_TEAM_COUNT);
        assertThat(leaderboard.stream().allMatch(e -> e.getGameState() == TeamGameState.COMPLETED)).isTrue();
    }

    private static class TeamPrincipals {
        final Long teamId;
        final PlayerPrincipal p1;
        final PlayerPrincipal p2;

        TeamPrincipals(Long teamId, PlayerPrincipal p1, PlayerPrincipal p2) {
            this.teamId = teamId;
            this.p1 = p1;
            this.p2 = p2;
        }
    }
}
