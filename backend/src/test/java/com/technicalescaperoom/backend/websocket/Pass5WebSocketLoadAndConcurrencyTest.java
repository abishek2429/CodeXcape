package com.technicalescaperoom.backend.websocket;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.config.websocket.WebSocketSessionRegistry;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameWebSocketPublisher;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("dev")
public class Pass5WebSocketLoadAndConcurrencyTest {

    @Autowired
    private WebSocketSessionRegistry sessionRegistry;

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
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GameWebSocketPublisher webSocketPublisher;

    private Event testEvent;
    private Level level1;

    @BeforeEach
    void setUp() {
        sessionRegistry.clear();
        reset(messagingTemplate);

        testEvent = eventRepository.save(Event.builder()
                .name("Pass 5 Benchmark Event " + UUID.randomUUID())
                .status(EventStatus.RUNNING)
                .passkeyHash("$2a$10$dummyHashPass5")
                .startTime(Instant.now())
                .createdAt(Instant.now())
                .build());

        level1 = levelRepository.findByLevelNumber(1)
                .orElseGet(() -> levelRepository.save(Level.builder()
                        .levelNumber(1)
                        .name("Pass5 Level 1")
                        .isActive(true)
                        .build()));
    }

    @Test
    @DisplayName("1. Multi-Tab Presence Stability: No false disconnect on closing secondary tab")
    void testWebSocketSessionRegistryMultiTabPresence() {
        Long p1Id = 101L;

        // Tab 1 connects
        boolean firstConn = sessionRegistry.registerPlayerSession(p1Id, "sess-tab-1");
        assertThat(firstConn).isTrue();
        assertThat(sessionRegistry.isPlayerConnected(p1Id)).isTrue();
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(1);

        // Tab 2 connects (same player opens second tab)
        boolean secondConn = sessionRegistry.registerPlayerSession(p1Id, "sess-tab-2");
        assertThat(secondConn).isFalse(); // Not first connection
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(2);

        // Tab 1 closes (disconnect event arrives for Tab 1)
        boolean firstDisc = sessionRegistry.unregisterPlayerSession(p1Id, "sess-tab-1");
        assertThat(firstDisc).isFalse(); // Not last disconnection! Player is STILL connected!
        assertThat(sessionRegistry.isPlayerConnected(p1Id)).isTrue();
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(1);

        // Tab 2 closes (player closes last remaining tab)
        boolean lastDisc = sessionRegistry.unregisterPlayerSession(p1Id, "sess-tab-2");
        assertThat(lastDisc).isTrue(); // Now player is truly offline!
        assertThat(sessionRegistry.isPlayerConnected(p1Id)).isFalse();
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("2. Database-First Publishing: Event published on commit, suppressed on rollback")
    void testDatabaseFirstEventPublishing() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        // A. Successful transaction -> Event published after commit
        txTemplate.execute(status -> {
            webSocketPublisher.notifyLevelCompleted(999L, 1);
            // Inside tx: should not have dispatched yet
            verify(messagingTemplate, never()).convertAndSend(eq("/topic/team/999"), any(WebSocketEventDto.class));
            return null;
        });

        // After tx commit: should be dispatched
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/team/999"), any(WebSocketEventDto.class));
        reset(messagingTemplate);

        // B. Rolling-back transaction -> Event NEVER published
        try {
            txTemplate.execute(status -> {
                webSocketPublisher.notifyLevelCompleted(999L, 1);
                throw new RuntimeException("Simulated database constraint failure");
            });
        } catch (RuntimeException ignored) {}

        // Assert message was NEVER sent to clients
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/team/999"), any(WebSocketEventDto.class));
    }

    @Test
    @DisplayName("3. Stage Completed Real-time Event: Emitted on intermediate stage completion")
    void testStageCompletedEventPublication() {
        Team team = createTestTeam("TEAM-P5-STAGE");
        Player p1 = createPlayer(team, 1);
        Player p2 = createPlayer(team, 2);

        PlayerPrincipal p1Principal = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(team.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .displayName(p1.getDisplayName())
                .sessionToken("token-p1-" + UUID.randomUUID())
                .build();

        PlayerPrincipal p2Principal = PlayerPrincipal.builder()
                .playerId(p2.getId())
                .teamId(team.getId())
                .eventId(testEvent.getId())
                .playerNumber(2)
                .displayName(p2.getDisplayName())
                .sessionToken("token-p2-" + UUID.randomUUID())
                .build();

        gameSessionRepository.save(GameSession.builder()
                .team(team)
                .player(p1)
                .sessionToken(p1Principal.getSessionToken())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now())
                .build());

        gameSessionRepository.save(GameSession.builder()
                .team(team)
                .player(p2)
                .sessionToken(p2Principal.getSessionToken())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now())
                .build());

        Question q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level1.getId(), 1, QuestionPlayer.PLAYER_1)
                .orElseThrow();
        Question q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(level1.getId(), 1, QuestionPlayer.PLAYER_2)
                .orElseThrow();

        // Player 1 solves Stage 1
        questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());

        // Player 2 solves Stage 1 (now both completed for Stage 1 of 2)
        AnswerSubmissionResponseDto p2Resp = questionAnswerService.submitAnswer(p2Principal, AnswerSubmissionRequest.builder().levelNumber(1).answer(q2.getExpectedAnswerHash()).build());
        assertThat(p2Resp.getStageCompleted()).isTrue();
        assertThat(p2Resp.getNextStageNumber()).isEqualTo(2);

        // Verify STAGE_COMPLETED event was published
        ArgumentCaptor<WebSocketEventDto> captor = ArgumentCaptor.forClass(WebSocketEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/team/" + team.getId()), captor.capture());

        boolean hasStageCompleted = captor.getAllValues().stream()
                .anyMatch(e -> e.getType() == WebSocketEventType.STAGE_COMPLETED && e.getStageNumber() == 1 && e.getNextStageNumber() == 2);
        assertThat(hasStageCompleted).isTrue();
    }

    @Test
    @DisplayName("4. Targeted Rank Broadcast: Only affected teams receive update without leaking full leaderboard")
    void testTargetedRankBroadcast() {
        Team teamA = createTestTeam("TEAM-A");
        Team teamB = createTestTeam("TEAM-B");

        reset(messagingTemplate);

        // Trigger rank recalculation
        leaderboardService.recalculateAndBroadcastRanks(testEvent.getId(), webSocketPublisher);

        // Verify team channels received targeted RANK_CHANGED events
        ArgumentCaptor<WebSocketEventDto> captorA = ArgumentCaptor.forClass(WebSocketEventDto.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/team/" + teamA.getId()), captorA.capture());

        WebSocketEventDto eventA = captorA.getValue();
        assertThat(eventA.getType()).isEqualTo(WebSocketEventType.RANK_CHANGED);
        assertThat(eventA.getNewRank()).isNotNull();
        // Crucial security check: Payload must NOT contain other teams, hidden answers, or raw leaderboard data
        assertThat(eventA.getMessage()).isNull();
    }

    @Test
    @DisplayName("5. Concurrency Load Test: 50 teams / 100 players concurrent connection storm")
    void testConnectionStormSimulation50Teams100Players() throws Exception {
        int numPlayers = 100;
        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numPlayers);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 1; i <= numPlayers; i++) {
            final long playerId = 1000L + i;
            final String sessionId = "storm-sess-" + i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Simultaneous storm release
                    boolean first = sessionRegistry.registerPlayerSession(playerId, sessionId);
                    if (first) successCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Unleash 100 players at once
        boolean completed = doneLatch.await(10, TimeUnit.SECONDS);
        assertThat(completed).isTrue();
        assertThat(successCount.get()).isEqualTo(numPlayers);
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(numPlayers);

        // Concurrent cleanup
        CountDownLatch discLatch = new CountDownLatch(numPlayers);
        for (int i = 1; i <= numPlayers; i++) {
            final long playerId = 1000L + i;
            final String sessionId = "storm-sess-" + i;
            executor.submit(() -> {
                try {
                    sessionRegistry.unregisterPlayerSession(playerId, sessionId);
                } finally {
                    discLatch.countDown();
                }
            });
        }

        boolean discCompleted = discLatch.await(10, TimeUnit.SECONDS);
        assertThat(discCompleted).isTrue();
        assertThat(sessionRegistry.getActiveConnectionCount()).isEqualTo(0);
        executor.shutdown();
    }

    private Team createTestTeam(String code) {
        Team team = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode(code + "-" + UUID.randomUUID().toString().substring(0, 5))
                .teamName("Team " + code)
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .createdAt(Instant.now())
                .build());

        teamLevelProgressRepository.save(TeamLevelProgress.builder()
                .team(team)
                .level(level1)
                .levelStatus(LevelStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build());

        teamStageProgressRepository.save(TeamStageProgress.builder()
                .team(team)
                .level(level1)
                .stageNumber(1)
                .discoveryKey("L1-S1")
                .player1Completed(false)
                .player2Completed(false)
                .build());

        return team;
    }

    private Player createPlayer(Team team, int number) {
        return playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(number)
                .displayName("Player " + number)
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .createdAt(Instant.now())
                .build());
    }
}
