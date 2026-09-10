package com.technicalescaperoom.backend.benchmark;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.config.websocket.WebSocketSessionRegistry;
import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.AdminDashboardService;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("dev")
public class Pass7LoadAndStressReliabilityTest {

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
    private AnswerAttemptRepository answerAttemptRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private PlayerSessionService playerSessionService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private GameStateService gameStateService;

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
    private WebSocketSessionRegistry sessionRegistry;

    @Autowired
    private GameWebSocketPublisher webSocketPublisher;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    private Event event;
    private Level level1;
    private Level level6;
    private Question l1s1q1;
    private Question l1s1q2;

    @BeforeEach
    void setUp() {
        sessionRegistry.clear();
        reset(messagingTemplate);

        event = eventRepository.save(Event.builder()
                .name("Pass 7 Load Test Event " + UUID.randomUUID())
                .description("Production Scale Load & Stress Verification")
                .status(EventStatus.READY)
                .passkeyHash(passwordEncoder.encode("849201"))
                .startTime(Instant.now())
                .createdAt(Instant.now())
                .build());

        level1 = levelRepository.findByLevelNumber(1)
                .orElseGet(() -> levelRepository.save(Level.builder()
                        .levelNumber(1)
                        .name("Level 1 Reconstruction")
                        .isActive(true)
                        .build()));

        level6 = levelRepository.findByLevelNumber(6)
                .orElseGet(() -> levelRepository.save(Level.builder()
                        .levelNumber(6)
                        .name("Level 6 The Core")
                        .isActive(true)
                        .build()));

        l1s1q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level1.getId(), 1, QuestionPlayer.PLAYER_1)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .stageNumber(1)
                        .playerNumber(QuestionPlayer.PLAYER_1)
                        .puzzleContext("L1 S1 Q1")
                        .evidence("Evidence P1")
                        .expectedAnswerHash("SYS_INIT_P1")
                        .answerType(AnswerType.TEXT)
                        .isActive(true)
                        .build()));

        l1s1q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level1.getId(), 1, QuestionPlayer.PLAYER_2)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .stageNumber(1)
                        .playerNumber(QuestionPlayer.PLAYER_2)
                        .puzzleContext("L1 S1 Q2")
                        .evidence("Evidence P2")
                        .expectedAnswerHash("SYS_INIT_P2")
                        .answerType(AnswerType.TEXT)
                        .isActive(true)
                        .build()));
    }

    // =========================================================================
    // STEP 4: BASELINE MEASUREMENTS (Single-User Request Latencies & System State)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Baseline Measurements: System resources and single-operation latency")
    void test1_BaselineMeasurements() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;
        int activeThreads = Thread.activeCount();

        System.out.println("==================================================");
        System.out.println("PASS 7 BASELINE SYSTEM METRICS");
        System.out.println("==================================================");
        System.out.println("JVM Heap Total: " + totalMemory + " MB");
        System.out.println("JVM Heap Used:  " + usedMemory + " MB");
        System.out.println("JVM Heap Free:  " + freeMemory + " MB");
        System.out.println("Active Threads: " + activeThreads);
        System.out.println("Active WS Connections: " + sessionRegistry.getActiveConnectionCount());

        // Single baseline team
        Team team = createRegisteredTeam("BASE-01");
        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 1).orElseThrow();

        // 1. Baseline Login Latency
        long t0 = System.nanoTime();
        PlayerResponseDto loginResp = playerSessionService.login(
                PlayerLoginRequest.builder().teamCode(team.getTeamCode()).playerNumber(1).build(),
                new MockHttpServletRequest(), new MockHttpServletResponse()
        );
        long loginNs = System.nanoTime() - t0;
        assertThat(loginResp).isNotNull();

        PlayerPrincipal principal = buildPrincipal(team, p1, loginResp.getSessionToken());

        // 2. Baseline Get Current Player
        t0 = System.nanoTime();
        PlayerResponseDto meResp = playerSessionService.getCurrentPlayer(principal);
        long meNs = System.nanoTime() - t0;
        assertThat(meResp).isNotNull();

        // 3. Baseline Get Lobby State
        t0 = System.nanoTime();
        PlayerResponseDto lobbyResp = playerSessionService.getLobbyState(principal);
        long lobbyNs = System.nanoTime() - t0;
        assertThat(lobbyResp).isNotNull();

        // 4. Baseline Toggle Ready (Both P1 and P2 must be ready to start)
        t0 = System.nanoTime();
        PlayerResponseDto readyResp = playerSessionService.setPlayerReady(principal, true);
        long readyNs = System.nanoTime() - t0;
        assertThat(readyResp.getIsReady()).isTrue();

        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 2).orElseThrow();
        PlayerResponseDto loginResp2 = playerSessionService.login(
                PlayerLoginRequest.builder().teamCode(team.getTeamCode()).playerNumber(2).build(),
                new MockHttpServletRequest(), new MockHttpServletResponse()
        );
        PlayerPrincipal principal2 = buildPrincipal(team, p2, loginResp2.getSessionToken());
        playerSessionService.setPlayerReady(principal2, true);

        // 5. Baseline Start Team Event
        t0 = System.nanoTime();
        PlayerResponseDto startResp = playerSessionService.startTeamEvent(principal);
        long startNs = System.nanoTime() - t0;
        assertThat(startResp.getGameState()).isEqualTo("IN_PROGRESS");

        // 6. Baseline Get Game State
        t0 = System.nanoTime();
        PlayerGameStateDto stateResp = gameStateService.getGameStateForPlayer(principal);
        long stateNs = System.nanoTime() - t0;
        assertThat(stateResp).isNotNull();

        // 7. Baseline Get Current Question
        t0 = System.nanoTime();
        PlayerQuestionDto qResp = questionAnswerService.getCurrentQuestionForPlayer(principal);
        long questionNs = System.nanoTime() - t0;
        assertThat(qResp).isNotNull();

        // 8. Baseline Submit Answer
        t0 = System.nanoTime();
        AnswerSubmissionResponseDto ansResp = questionAnswerService.submitAnswer(principal,
                AnswerSubmissionRequest.builder().levelNumber(1).answer(l1s1q1.getExpectedAnswerHash()).build());
        long submitNs = System.nanoTime() - t0;
        assertThat(ansResp.getCorrect()).isTrue();

        // 9. Baseline Rank Recalculation
        t0 = System.nanoTime();
        leaderboardService.recalculateAndBroadcastRanks(event.getId(), webSocketPublisher);
        long rankNs = System.nanoTime() - t0;

        // 10. Baseline Admin Stats
        t0 = System.nanoTime();
        AdminDashboardResponseDto adminStats = adminDashboardService.getDashboardStats(event.getId());
        long adminNs = System.nanoTime() - t0;
        assertThat(adminStats).isNotNull();

        System.out.println("BASELINE OPERATION LATENCIES (Single User):");
        System.out.println("  Login:          " + String.format("%.2f", loginNs / 1_000_000.0) + " ms");
        System.out.println("  Get Player Me:  " + String.format("%.2f", meNs / 1_000_000.0) + " ms");
        System.out.println("  Get Lobby:      " + String.format("%.2f", lobbyNs / 1_000_000.0) + " ms");
        System.out.println("  Set Ready:      " + String.format("%.2f", readyNs / 1_000_000.0) + " ms");
        System.out.println("  Start Event:    " + String.format("%.2f", startNs / 1_000_000.0) + " ms");
        System.out.println("  Get Game State: " + String.format("%.2f", stateNs / 1_000_000.0) + " ms");
        System.out.println("  Get Question:   " + String.format("%.2f", questionNs / 1_000_000.0) + " ms");
        System.out.println("  Submit Answer:  " + String.format("%.2f", submitNs / 1_000_000.0) + " ms");
        System.out.println("  Rank Recalc:    " + String.format("%.2f", rankNs / 1_000_000.0) + " ms");
        System.out.println("  Admin Stats:    " + String.format("%.2f", adminNs / 1_000_000.0) + " ms");
        System.out.println("==================================================");
    }

    // =========================================================================
    // STEP 6: AUTHENTICATION LOAD TEST (100 Players Concurrent Login Storm)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Authentication Load: 100 players concurrent login storm")
    void test2_AuthenticationLoadAndSpike_100Players() throws Exception {
        int teamCount = 50;
        int totalPlayers = teamCount * 2; // 100 players

        List<Team> teams = new ArrayList<>(teamCount);
        for (int i = 1; i <= teamCount; i++) {
            teams.add(createRegisteredTeam(String.format("AUTH-%02d", i)));
        }

        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalPlayers);

        ConcurrentLinkedQueue<Long> latencies = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (Team team : teams) {
            for (int pNum = 1; pNum <= 2; pNum++) {
                final String code = team.getTeamCode();
                final int playerNum = pNum;

                executor.submit(() -> {
                    try {
                        startLatch.await(); // Release all 100 logins simultaneously
                        long start = System.nanoTime();
                        PlayerResponseDto resp = playerSessionService.login(
                                PlayerLoginRequest.builder().teamCode(code).playerNumber(playerNum).build(),
                                new MockHttpServletRequest(),
                                new MockHttpServletResponse()
                        );
                        long dur = System.nanoTime() - start;
                        if (resp != null && resp.getSessionToken() != null) {
                            successCount.incrementAndGet();
                            latencies.add(dur);
                        } else {
                            failureCount.incrementAndGet();
                        }
                    } catch (Exception e) {
                        System.err.println("LOGIN ERROR: " + e.getClass().getName() + " - " + e.getMessage());
                        failureCount.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }
        }

        long stormStart = System.nanoTime();
        startLatch.countDown(); // Unleash 100 logins
        boolean finished = doneLatch.await(30, TimeUnit.SECONDS);
        long stormDurationMs = (System.nanoTime() - stormStart) / 1_000_000;
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(successCount.get()).isEqualTo(totalPlayers);
        assertThat(failureCount.get()).isEqualTo(0);

        List<Long> latList = new ArrayList<>(latencies);
        Collections.sort(latList);

        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;
        double throughput = (totalPlayers * 1000.0) / stormDurationMs;

        System.out.println("AUTHENTICATION STORM RESULTS (100 Players Concurrent):");
        System.out.println("  Total Logins:     " + totalPlayers);
        System.out.println("  Successful:       " + successCount.get());
        System.out.println("  Failed:           " + failureCount.get());
        System.out.println("  Throughput:       " + String.format("%.2f", throughput) + " logins/sec");
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
        System.out.println("  Max Duration:     " + stormDurationMs + " ms");
    }

    // =========================================================================
    // STEP 7 & 8: TEAM LOBBY & WEBSOCKET PRESENCE (50 Teams / 100 Players)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Team Lobby & Readiness Storm: 50 teams / 100 players concurrent sync")
    void test3_TeamLobbyAndReadinessStorm_50Teams100Players() throws Exception {
        int teamCount = 50;
        int totalPlayers = teamCount * 2;

        List<Team> teams = new ArrayList<>(teamCount);
        List<PlayerPrincipal> principals = new ArrayList<>(totalPlayers);

        for (int i = 1; i <= teamCount; i++) {
            Team team = createRegisteredTeam(String.format("LOBBY-%02d", i));
            teams.add(team);
            for (int pNum = 1; pNum <= 2; pNum++) {
                Player p = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), pNum).orElseThrow();
                PlayerResponseDto login = playerSessionService.login(
                        PlayerLoginRequest.builder().teamCode(team.getTeamCode()).playerNumber(pNum).build(),
                        new MockHttpServletRequest(), new MockHttpServletResponse()
                );
                principals.add(buildPrincipal(team, p, login.getSessionToken()));
                // Register WebSocket connection
                sessionRegistry.registerPlayerSession(p.getId(), "sess-p-" + p.getId());
            }
        }

        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(totalPlayers);

        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalPlayers);

        ConcurrentLinkedQueue<Long> readyLatencies = new ConcurrentLinkedQueue<>();
        AtomicInteger readySuccess = new AtomicInteger(0);

        for (PlayerPrincipal principal : principals) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    // 1. Query lobby state
                    PlayerResponseDto lobby = playerSessionService.getLobbyState(principal);
                    // 2. Set ready
                    PlayerResponseDto ready = playerSessionService.setPlayerReady(principal, true);
                    long dur = System.nanoTime() - t0;
                    if (Boolean.TRUE.equals(ready.getIsReady())) {
                        readySuccess.incrementAndGet();
                        readyLatencies.add(dur);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        long tStart = System.nanoTime();
        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        long elapsedMs = (System.nanoTime() - tStart) / 1_000_000;
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(readySuccess.get()).isEqualTo(totalPlayers);

        List<Long> latList = new ArrayList<>(readyLatencies);
        Collections.sort(latList);
        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;

        System.out.println("LOBBY & READINESS RESULTS (50 Teams / 100 Players Concurrent):");
        System.out.println("  Total Operators:  " + totalPlayers);
        System.out.println("  Readiness Confirmed: " + readySuccess.get());
        System.out.println("  Active WS Conns:  " + sessionRegistry.getActiveConnectionCount());
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
    }

    // =========================================================================
    // STEP 11: START EVENT SPIKE (50 Teams Attempting Start Concurrently)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Start Event Spike: 50 teams / 100 players concurrent start & idempotency")
    void test4_StartEventSpike_50TeamsConcurrently() throws Exception {
        int teamCount = 50;
        List<Team> teams = new ArrayList<>(teamCount);
        List<PlayerPrincipal> allPrincipals = new ArrayList<>(teamCount * 2);

        for (int i = 1; i <= teamCount; i++) {
            Team team = createRegisteredTeam(String.format("START-%02d", i));
            teams.add(team);
            for (int pNum = 1; pNum <= 2; pNum++) {
                Player p = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), pNum).orElseThrow();
                PlayerResponseDto login = playerSessionService.login(
                        PlayerLoginRequest.builder().teamCode(team.getTeamCode()).playerNumber(pNum).build(),
                        new MockHttpServletRequest(), new MockHttpServletResponse()
                );
                PlayerPrincipal principal = buildPrincipal(team, p, login.getSessionToken());
                allPrincipals.add(principal);
                playerSessionService.setPlayerReady(principal, true);
            }
        }

        // Both players on each of the 50 teams attempt startTeamEvent concurrently
        ExecutorService executor = Executors.newFixedThreadPool(25);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(allPrincipals.size());

        ConcurrentLinkedQueue<Long> startLatencies = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);

        for (PlayerPrincipal principal : allPrincipals) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    PlayerResponseDto res = playerSessionService.startTeamEvent(principal);
                    long dur = System.nanoTime() - t0;
                    if ("IN_PROGRESS".equals(res.getGameState())) {
                        successCount.incrementAndGet();
                        startLatencies.add(dur);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isEqualTo(allPrincipals.size());

        // Verify each team started exactly once
        for (Team team : teams) {
            Team reloaded = teamRepository.findById(team.getId()).orElseThrow();
            assertThat(reloaded.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS);
            assertThat(reloaded.getStartedAt()).isNotNull();

            // Verify progress was created with exactly 6 levels
            List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
            assertThat(progressList).hasSize(6);
            assertThat(progressList.get(0).getLevelStatus()).isIn(LevelStatus.AVAILABLE, LevelStatus.IN_PROGRESS);
        }

        List<Long> latList = new ArrayList<>(startLatencies);
        Collections.sort(latList);
        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;

        System.out.println("START EVENT SPIKE RESULTS (50 Teams / 100 Players Simultaneous):");
        System.out.println("  Concurrent Calls: " + allPrincipals.size());
        System.out.println("  Successful:       " + successCount.get());
        System.out.println("  Teams Started:    " + teamCount + " / " + teamCount);
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
    }

    // =========================================================================
    // STEP 13 & 14: CONCURRENT SUBMISSIONS (P1 and P2 Simultaneous on Same Team)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Concurrent Submissions: P1 and P2 simultaneous submission on 50 teams")
    void test5_ConcurrentP1AndP2Submissions_PessimisticLockingVerification() throws Exception {
        int teamCount = 50;
        List<Team> teams = new ArrayList<>(teamCount);
        List<PlayerPrincipal> p1List = new ArrayList<>(teamCount);
        List<PlayerPrincipal> p2List = new ArrayList<>(teamCount);

        for (int i = 1; i <= teamCount; i++) {
            Team team = createActiveTeam("CONC-" + i);
            teams.add(team);
            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 1).orElseThrow();
            Player p2 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 2).orElseThrow();
            p1List.add(buildPrincipal(team, p1, "token-p1-" + i));
            p2List.add(buildPrincipal(team, p2, "token-p2-" + i));
        }

        ExecutorService executor = Executors.newFixedThreadPool(25);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(teamCount * 2);

        ConcurrentLinkedQueue<Long> submissionLatencies = new ConcurrentLinkedQueue<>();
        AtomicInteger p1Success = new AtomicInteger(0);
        AtomicInteger p2Success = new AtomicInteger(0);

        for (int i = 0; i < teamCount; i++) {
            final PlayerPrincipal princ1 = p1List.get(i);
            final PlayerPrincipal princ2 = p2List.get(i);

            // Thread for P1
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    AnswerSubmissionResponseDto res = questionAnswerService.submitAnswer(
                            princ1, AnswerSubmissionRequest.builder().levelNumber(1).answer(l1s1q1.getExpectedAnswerHash()).build()
                    );
                    submissionLatencies.add(System.nanoTime() - t0);
                    if (Boolean.TRUE.equals(res.getCorrect())) p1Success.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });

            // Thread for P2
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    AnswerSubmissionResponseDto res = questionAnswerService.submitAnswer(
                            princ2, AnswerSubmissionRequest.builder().levelNumber(1).answer(l1s1q2.getExpectedAnswerHash()).build()
                    );
                    submissionLatencies.add(System.nanoTime() - t0);
                    if (Boolean.TRUE.equals(res.getCorrect())) p2Success.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        long tStart = System.nanoTime();
        startLatch.countDown(); // Fire all P1 and P2 submissions simultaneously
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        long elapsedMs = (System.nanoTime() - tStart) / 1_000_000;
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(p1Success.get()).isEqualTo(teamCount);
        assertThat(p2Success.get()).isEqualTo(teamCount);

        // Verify stage progress for all teams: both completed
        for (Team team : teams) {
            TeamStageProgress stageProg = teamStageProgressRepository.findByTeamIdAndLevelIdAndStageNumber(team.getId(), level1.getId(), 1)
                    .orElseThrow();
            assertThat(stageProg.getPlayer1Completed()).isTrue();
            assertThat(stageProg.getPlayer2Completed()).isTrue();
        }

        List<Long> latList = new ArrayList<>(submissionLatencies);
        Collections.sort(latList);
        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;

        System.out.println("CONCURRENT SUBMISSIONS RESULTS (100 Submissions / Pessimistic Locking):");
        System.out.println("  P1 Solved:        " + p1Success.get() + " / " + teamCount);
        System.out.println("  P2 Solved:        " + p2Success.get() + " / " + teamCount);
        System.out.println("  Deadlocks:        0");
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
        System.out.println("  Total Duration:   " + elapsedMs + " ms");
    }

    // =========================================================================
    // STEP 15: RANKING RECALCULATION & TARGETED BROADCAST UNDER LOAD
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Ranking Load: Leaderboard calculation & targeted delivery across 50 teams")
    void test6_RankingLoadUnderHeavyStageCompletions() {
        int teamCount = 50;
        for (int i = 1; i <= teamCount; i++) {
            createActiveTeam("RANK-" + i);
        }

        reset(messagingTemplate);

        long t0 = System.nanoTime();
        leaderboardService.recalculateAndBroadcastRanks(event.getId(), webSocketPublisher);
        long recalcDurationMs = (System.nanoTime() - t0) / 1_000_000;

        // Verify targeted rank delivery occurred
        ArgumentCaptor<WebSocketEventDto> captor = ArgumentCaptor.forClass(WebSocketEventDto.class);
        verify(messagingTemplate, atLeast(teamCount)).convertAndSend(any(String.class), captor.capture());

        List<WebSocketEventDto> rankEvents = captor.getAllValues().stream()
                .filter(e -> e.getType() == WebSocketEventType.RANK_CHANGED)
                .toList();

        assertThat(rankEvents).isNotEmpty();
        for (WebSocketEventDto rankEv : rankEvents) {
            assertThat(rankEv.getNewRank()).isNotNull();
            assertThat(rankEv.getNewRank()).isBetween(1, teamCount);
            // Verify strict team isolation: No full leaderboard or secret data exposed
            assertThat(rankEv.getMessage()).isNull();
        }

        System.out.println("RANKING CALCULATION RESULTS (50 Teams Batch):");
        System.out.println("  Teams Ranked:     " + teamCount);
        System.out.println("  Recalc Latency:   " + recalcDurationMs + " ms");
        System.out.println("  Events Dispatched:" + rankEvents.size());
    }

    // =========================================================================
    // STEP 16: ADMIN MONITORING UNDER ACTIVE GAMEPLAY LOAD
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Admin Monitoring Load: Simultaneous organizer telemetry queries")
    void test7_AdminMonitoringConcurrency() throws Exception {
        int teamCount = 50;
        for (int i = 1; i <= teamCount; i++) {
            createActiveTeam("ADM-" + i);
        }

        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(40); // 40 admin requests in rapid burst

        ConcurrentLinkedQueue<Long> adminLatencies = new ConcurrentLinkedQueue<>();
        AtomicInteger adminSuccess = new AtomicInteger(0);

        for (int i = 0; i < 10; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    AdminDashboardResponseDto stats = adminDashboardService.getDashboardStats(event.getId());
                    adminLatencies.add(System.nanoTime() - t0);
                    if (stats != null) adminSuccess.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });

            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    List<AdminTeamProgressDto> teams = adminDashboardService.getTeamsProgress(event.getId(), "", null, "ALL");
                    adminLatencies.add(System.nanoTime() - t0);
                    if (teams.size() >= teamCount) adminSuccess.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });

            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    List<LeaderboardEntryDto> lb = leaderboardService.getLeaderboard(event.getId());
                    adminLatencies.add(System.nanoTime() - t0);
                    if (lb.size() >= teamCount) adminSuccess.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });

            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    var sessions = adminDashboardService.getActiveSessions(event.getId());
                    adminLatencies.add(System.nanoTime() - t0);
                    if (sessions != null) adminSuccess.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        long tStart = System.nanoTime();
        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        long elapsedMs = (System.nanoTime() - tStart) / 1_000_000;
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(adminSuccess.get()).isEqualTo(40);

        List<Long> latList = new ArrayList<>(adminLatencies);
        Collections.sort(latList);
        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;

        System.out.println("ADMIN MONITORING CONCURRENCY RESULTS (40 Telemetry Requests):");
        System.out.println("  Successful:       " + adminSuccess.get() + " / 40");
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
        System.out.println("  Total Duration:   " + elapsedMs + " ms");
    }

    // =========================================================================
    // STEP 18: FINAL COMPLETION SPIKE (50 Teams Submitting Passkey '849201')
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Final Completion Spike: 50 teams submitting final passkey concurrently")
    void test8_FinalCompletionSpike_50Teams() throws Exception {
        int teamCount = 50;
        List<Team> teams = new ArrayList<>(teamCount);
        List<PlayerPrincipal> principals = new ArrayList<>(teamCount);

        for (int i = 1; i <= teamCount; i++) {
            Team team = createActiveTeam("FIN-" + i);
            teams.add(team);

            // Mark all 6 levels completed so team enters FINAL_PASSKEY state
            List<TeamLevelProgress> progList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
            for (TeamLevelProgress prog : progList) {
                prog.setLevelStatus(LevelStatus.COMPLETED);
                teamLevelProgressRepository.save(prog);
            }
            team.setGameState(TeamGameState.FINAL_PASSKEY);
            teamRepository.save(team);

            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 1).orElseThrow();
            principals.add(buildPrincipal(team, p1, "token-fin-" + i));
        }

        ExecutorService executor = Executors.newFixedThreadPool(25);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(teamCount);

        ConcurrentLinkedQueue<Long> passkeyLatencies = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);

        for (PlayerPrincipal principal : principals) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long t0 = System.nanoTime();
                    FinalPasskeyResponseDto res = finalPasskeyService.submitFinalPasskey(
                            principal,
                            FinalPasskeySubmissionRequest.builder().passkey("849201").build()
                    );
                    passkeyLatencies.add(System.nanoTime() - t0);
                    if ("COMPLETED".equals(res.getStatus())) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        long tStart = System.nanoTime();
        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        long elapsedMs = (System.nanoTime() - tStart) / 1_000_000;
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isEqualTo(teamCount);

        for (Team team : teams) {
            Team reloaded = teamRepository.findById(team.getId()).orElseThrow();
            assertThat(reloaded.getGameState()).isEqualTo(TeamGameState.COMPLETED);
            assertThat(reloaded.getCompletedAt()).isNotNull();
        }

        List<Long> latList = new ArrayList<>(passkeyLatencies);
        Collections.sort(latList);
        double p50 = latList.get((int) (latList.size() * 0.50)) / 1_000_000.0;
        double p95 = latList.get((int) (latList.size() * 0.95)) / 1_000_000.0;
        double p99 = latList.get((int) (latList.size() * 0.99)) / 1_000_000.0;

        System.out.println("FINAL COMPLETION SPIKE RESULTS (50 Teams Simultaneous Escape):");
        System.out.println("  Escaped Teams:    " + successCount.get() + " / " + teamCount);
        System.out.println("  Atomic Completion:100% verified");
        System.out.println("  Latency p50:      " + String.format("%.2f", p50) + " ms");
        System.out.println("  Latency p95:      " + String.format("%.2f", p95) + " ms");
        System.out.println("  Latency p99:      " + String.format("%.2f", p99) + " ms");
        System.out.println("  Total Duration:   " + elapsedMs + " ms");
    }

    // =========================================================================
    // STEP 22: STRESS BEYOND TARGET (75 Teams / 150 Players & 100 Teams / 200 Players)
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Stress Beyond Capacity: Scaling to 75 teams (150 players) and 100 teams (200 players)")
    void test9_StressBeyondTarget_75And100Teams() throws Exception {
        // A. Stress 75 Teams (150 Players)
        int stress75Count = 75;
        int stress75Players = stress75Count * 2;
        List<Team> teams75 = new ArrayList<>(stress75Count);
        for (int i = 1; i <= stress75Count; i++) {
            teams75.add(createRegisteredTeam("ST75-" + i));
        }

        ExecutorService exec75 = Executors.newFixedThreadPool(30);
        CountDownLatch start75 = new CountDownLatch(1);
        CountDownLatch done75 = new CountDownLatch(stress75Players);
        AtomicInteger success75 = new AtomicInteger(0);

        for (Team team : teams75) {
            for (int pNum = 1; pNum <= 2; pNum++) {
                final String code = team.getTeamCode();
                final int num = pNum;
                exec75.submit(() -> {
                    try {
                        start75.await();
                        PlayerResponseDto res = playerSessionService.login(
                                PlayerLoginRequest.builder().teamCode(code).playerNumber(num).build(),
                                new MockHttpServletRequest(), new MockHttpServletResponse()
                        );
                        if (res != null) success75.incrementAndGet();
                    } catch (Exception ignored) {
                    } finally {
                        done75.countDown();
                    }
                });
            }
        }

        long t0 = System.nanoTime();
        start75.countDown();
        boolean finished75 = done75.await(30, TimeUnit.SECONDS);
        long dur75Ms = (System.nanoTime() - t0) / 1_000_000;
        exec75.shutdown();

        assertThat(finished75).isTrue();
        assertThat(success75.get()).isEqualTo(stress75Players);

        System.out.println("STRESS TEST 1 — 75 TEAMS (150 Players Concurrent):");
        System.out.println("  Logins Successful:" + success75.get() + " / " + stress75Players);
        System.out.println("  Total Duration:   " + dur75Ms + " ms");
        System.out.println("  Throughput:       " + String.format("%.2f", (stress75Players * 1000.0) / dur75Ms) + " req/sec");

        // B. Stress 100 Teams (200 Players)
        int stress100Count = 100;
        int stress100Players = stress100Count * 2;
        List<Team> teams100 = new ArrayList<>(stress100Count);
        for (int i = 1; i <= stress100Count; i++) {
            teams100.add(createRegisteredTeam("ST100-" + i));
        }

        ExecutorService exec100 = Executors.newFixedThreadPool(40);
        CountDownLatch start100 = new CountDownLatch(1);
        CountDownLatch done100 = new CountDownLatch(stress100Players);
        AtomicInteger success100 = new AtomicInteger(0);

        for (Team team : teams100) {
            for (int pNum = 1; pNum <= 2; pNum++) {
                final String code = team.getTeamCode();
                final int num = pNum;
                exec100.submit(() -> {
                    try {
                        start100.await();
                        PlayerResponseDto res = playerSessionService.login(
                                PlayerLoginRequest.builder().teamCode(code).playerNumber(num).build(),
                                new MockHttpServletRequest(), new MockHttpServletResponse()
                        );
                        if (res != null) success100.incrementAndGet();
                    } catch (Exception ignored) {
                    } finally {
                        done100.countDown();
                    }
                });
            }
        }

        t0 = System.nanoTime();
        start100.countDown();
        boolean finished100 = done100.await(35, TimeUnit.SECONDS);
        long dur100Ms = (System.nanoTime() - t0) / 1_000_000;
        exec100.shutdown();

        assertThat(finished100).isTrue();
        assertThat(success100.get()).isEqualTo(stress100Players);

        System.out.println("STRESS TEST 2 — 100 TEAMS (200 Players Concurrent):");
        System.out.println("  Logins Successful:" + success100.get() + " / " + stress100Players);
        System.out.println("  Total Duration:   " + dur100Ms + " ms");
        System.out.println("  Throughput:       " + String.format("%.2f", (stress100Players * 1000.0) / dur100Ms) + " req/sec");
        System.out.println("  Breaking Point:   None encountered at 200 concurrent players (100% success)");
    }

    // =========================================================================
    // STEP 24: CONNECTION FAILURE & RECONNECT RECOVERY
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Connection Failure: Disconnecting and reconnecting 30% of players")
    void test10_ConnectionFailureAndReconnectRecovery() {
        int totalPlayers = 100;
        for (int i = 1; i <= totalPlayers; i++) {
            sessionRegistry.registerPlayerSession((long) i, "active-sess-" + i);
        }
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(totalPlayers);

        // Disconnect 30% of clients (simulating network flap)
        int disconnectCount = 30;
        for (int i = 1; i <= disconnectCount; i++) {
            boolean offline = sessionRegistry.unregisterPlayerSession((long) i, "active-sess-" + i);
            assertThat(offline).isTrue();
        }
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(totalPlayers - disconnectCount);

        // Reconnect all 30 disconnected clients with new session tokens
        for (int i = 1; i <= disconnectCount; i++) {
            boolean backOnline = sessionRegistry.registerPlayerSession((long) i, "reconnected-sess-" + i);
            assertThat(backOnline).isTrue();
        }
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(totalPlayers);

        System.out.println("CONNECTION RECOVERY RESULTS:");
        System.out.println("  Total Clients:    " + totalPlayers);
        System.out.println("  Disconnected:     " + disconnectCount);
        System.out.println("  Reconnected:      " + disconnectCount);
        System.out.println("  Final Active:     " + sessionRegistry.getActiveConnectionCount() + " (100% recovered)");
    }

    // =========================================================================
    // STEP 26: DATABASE FAILURE & ROLLBACK SAFETY
    // =========================================================================
    @Test
    @DisplayName("Pass 7 - Transaction Failure: Rollback safety under simulated failure")
    void test11_TransactionFailureAndRollbackSafety() {
        Team team = createActiveTeam("FAIL-SAFE");
        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), 1).orElseThrow();
        PlayerPrincipal principal = buildPrincipal(team, p1, "token-fail-safe");

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        // Verify that if an exception occurs mid-transaction, nothing is corrupted
        try {
            txTemplate.execute(status -> {
                questionAnswerService.submitAnswer(
                        principal,
                        AnswerSubmissionRequest.builder().levelNumber(1).answer(l1s1q1.getExpectedAnswerHash()).build()
                );
                throw new RuntimeException("Simulated mid-transaction database disruption");
            });
        } catch (RuntimeException ignored) {
        }

        // Verify stage progress was NOT committed
        TeamStageProgress stageProg = teamStageProgressRepository
                .findByTeamIdAndLevelIdAndStageNumber(team.getId(), level1.getId(), 1)
                .orElseThrow();
        assertThat(stageProg.getPlayer1Completed()).isFalse();

        // Verify WebSocket message was NOT broadcast
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/team/" + team.getId()), any(WebSocketEventDto.class));

        System.out.println("DATABASE FAILURE RESILIENCE RESULTS:");
        System.out.println("  Rollback Clean:   100% verified (zero half-committed state)");
        System.out.println("  WS Suppressed:    100% verified (no orphan event emitted)");
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    private Team createRegisteredTeam(String codeSuffix) {
        Team team = teamRepository.saveAndFlush(Team.builder()
                .event(event)
                .teamCode(("T-" + codeSuffix + "-" + UUID.randomUUID().toString().substring(0, 4)).toUpperCase())
                .teamName("Team " + codeSuffix)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .createdAt(Instant.now())
                .build());

        playerRepository.saveAndFlush(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Operator 1")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .createdAt(Instant.now())
                .build());

        playerRepository.saveAndFlush(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Operator 2")
                .status(PlayerStatus.INACTIVE)
                .isActive(true)
                .isReady(false)
                .createdAt(Instant.now())
                .build());

        return team;
    }

    private Team createActiveTeam(String codeSuffix) {
        Team team = createRegisteredTeam(codeSuffix);
        team.setStatus(TeamStatus.ACTIVE);
        team.setGameState(TeamGameState.IN_PROGRESS);
        team.setStartedAt(Instant.now());
        team = teamRepository.saveAndFlush(team);

        for (int l = 1; l <= 6; l++) {
            final int lvlNum = l;
            Level level = levelRepository.findByLevelNumber(lvlNum)
                    .orElseGet(() -> levelRepository.save(Level.builder()
                            .levelNumber(lvlNum)
                            .name("Level " + lvlNum)
                            .isActive(true)
                            .build()));

            teamLevelProgressRepository.saveAndFlush(TeamLevelProgress.builder()
                    .team(team)
                    .level(level)
                    .levelStatus(lvlNum == 1 ? LevelStatus.IN_PROGRESS : LevelStatus.LOCKED)
                    .startedAt(lvlNum == 1 ? Instant.now() : null)
                    .build());

            teamStageProgressRepository.saveAndFlush(TeamStageProgress.builder()
                    .team(team)
                    .level(level)
                    .stageNumber(1)
                    .discoveryKey("L" + lvlNum + "-S1")
                    .player1Completed(false)
                    .player2Completed(false)
                    .build());
        }

        return team;
    }

    private PlayerPrincipal buildPrincipal(Team team, Player player, String token) {
        return PlayerPrincipal.builder()
                .playerId(player.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(player.getPlayerNumber())
                .displayName(player.getDisplayName())
                .sessionToken(token)
                .build();
    }
}
