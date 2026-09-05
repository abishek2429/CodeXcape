package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerGameStateDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.GameWebSocketPublisher;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("dev")
public class WebSocketSecurityAndSynchronizationTest {

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private GameStateService gameStateService;

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
    private jakarta.persistence.EntityManager entityManager;

    @MockBean
    private GameWebSocketPublisher webSocketPublisher;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;
    private Level level1;

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();

        event = eventRepository.save(Event.builder()
                .name("WebSocket Sync Event 2026")
                .status(EventStatus.READY)
                .passkeyHash("hash")
                .build());

        level1 = levelRepository.findByLevelNumber(1).orElseGet(() -> levelRepository.save(Level.builder()
                .levelNumber(1)
                .name("Level 1: System Breaker")
                .description("Desc")
                .difficulty("EASY")
                .isActive(true)
                .build()));

        questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .playerNumber(QuestionPlayer.PLAYER_1)
                        .evidence("Find SSH port integer")
                        .expectedAnswerHash("22")
                        .answerType(AnswerType.NUMERIC)
                        .isActive(true)
                        .build()));

        questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .playerNumber(QuestionPlayer.PLAYER_2)
                        .evidence("Convert hex to ASCII")
                        .expectedAnswerHash("AB")
                        .answerType(AnswerType.TEXT)
                        .isActive(true)
                        .build()));

        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-WS-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 10000))
                .teamName("WebSocket Sync Squad")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(1)
                .displayName("Player A1")
                .status(PlayerStatus.INACTIVE)
                .build());

        playerA2 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(2)
                .displayName("Player A2")
                .status(PlayerStatus.INACTIVE)
                .build());

        gameStateService.initializeTeamGameState(teamA);
    }

    @Test
    @DisplayName("1. Player 1 solving challenge notifies partner via WebSocket without advancing level prematurely")
    void testSinglePlayerCompletionWebSocketNotification() {
        AnswerSubmissionRequest reqP1 = AnswerSubmissionRequest.builder().answer("22").build();
        AnswerSubmissionResponseDto resP1 = questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), reqP1);

        assertTrue(resP1.getCorrect());
        assertTrue(resP1.getIsCompleted());

        // Verify STOMP partner notification published
        verify(webSocketPublisher, atLeastOnce()).notifyPartnerChallengeCompleted(eq(teamA.getId()), eq(1), eq(1));

        // Team should still be on Level 1
        PlayerGameStateDto gameState = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(1, gameState.getCurrentLevel());
    }

    @Test
    @DisplayName("2. Both players completing Level 1 triggers atomic level progression & level completion STOMP broadcasts")
    void testBothPlayersCompletionTriggersLevelProgression() {
        // P1 submits correct answer
        questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), AnswerSubmissionRequest.builder().answer("22").build());

        // P2 submits correct answer
        questionAnswerService.submitAnswer(createPrincipal(playerA2, teamA), AnswerSubmissionRequest.builder().answer("AB").build());

        // Verify WebSocket events published
        verify(webSocketPublisher, atLeastOnce()).notifyLevelCompleted(eq(teamA.getId()), eq(1));
        verify(webSocketPublisher, atLeastOnce()).notifyNextLevelUnlocked(eq(teamA.getId()), eq(2));

        // Team should now be advanced to Level 2
        PlayerGameStateDto gameState = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(2, gameState.getCurrentLevel());
    }

    @Test
    @DisplayName("3. Race Condition Safety: Simultaneous submissions by P1 and P2 succeed cleanly without corrupting level state")
    void testSimultaneousSubmissionsRaceConditionSafety() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);

        executor.submit(() -> {
            try {
                startLatch.await();
                questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), AnswerSubmissionRequest.builder().levelNumber(1).answer("22").build());
                successCount.incrementAndGet();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                finishLatch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startLatch.await();
                questionAnswerService.submitAnswer(createPrincipal(playerA2, teamA), AnswerSubmissionRequest.builder().levelNumber(1).answer("AB").build());
                successCount.incrementAndGet();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                finishLatch.countDown();
            }
        });

        startLatch.countDown();
        boolean completed = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed);
        assertEquals(2, successCount.get());

        // Allow worker thread transaction commits to settle
        Thread.sleep(200);

        entityManager.clear();
        TeamLevelProgress progress = teamLevelProgressRepository.findByTeamIdAndLevelId(teamA.getId(), level1.getId()).orElseThrow();
        assertTrue(progress.getPlayer1Completed());
        assertTrue(progress.getPlayer2Completed());
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
                .sessionToken("test-token-ws-" + player.getId())
                .build();
    }
}
