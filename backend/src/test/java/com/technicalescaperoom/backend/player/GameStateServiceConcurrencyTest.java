package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class GameStateServiceConcurrencyTest {

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    private Event testEvent;
    private final List<Team> testTeams = new ArrayList<>();

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();
        testTeams.clear();

        testEvent = eventRepository.save(Event.builder()
                .name("Concurrency Test Event 2026")
                .description("Event for simulating concurrent team progression")
                .status(EventStatus.READY)
                .passkeyHash("hash123")
                .build());

        for (int i = 1; i <= 6; i++) {
            final int lvlNum = i;
            levelRepository.findByLevelNumber(lvlNum).orElseGet(() -> levelRepository.save(Level.builder()
                    .levelNumber(lvlNum)
                    .name("Level " + lvlNum + ": Challenge")
                    .description("Description " + lvlNum)
                    .difficulty("MEDIUM")
                    .isActive(true)
                    .build()));
        }

        // Create 10 simultaneous competing teams
        for (int t = 1; t <= 10; t++) {
            Team team = teamRepository.save(Team.builder()
                    .event(testEvent)
                    .teamCode("CONC-TEAM-" + t)
                    .teamName("Concurrent Team " + t)
                    .status(TeamStatus.REGISTERED)
                    .gameState(TeamGameState.NOT_STARTED)
                    .build());

            gameStateService.initializeTeamGameState(team);
            testTeams.add(team);
        }
    }

    @Test
    @DisplayName("Simulate 10 teams concurrently progressing through Level 1 to Level 6 simultaneously")
    void testConcurrentMultiTeamStateTransitions() throws InterruptedException {
        int numThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numThreads);
        AtomicInteger errorCount = new AtomicInteger(0);

        for (Team team : testTeams) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready

                    // Progress sequentially from Level 1 through Level 6
                    for (int lvl = 1; lvl <= 6; lvl++) {
                        gameStateService.completeLevel(team.getId(), lvl);
                        // Simulate duplicate completion call to test idempotency under concurrency
                        gameStateService.completeLevel(team.getId(), lvl);
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Release threads simultaneously
        boolean completedInTime = finishLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completedInTime, "Concurrent execution did not finish in 30 seconds");
        assertEquals(0, errorCount.get(), "No exceptions should occur during concurrent level completion");

        // Verify each team's state isolation and completion
        for (Team team : testTeams) {
            Team updated = teamRepository.findById(team.getId()).orElseThrow();
            assertEquals(TeamGameState.FINAL_PASSKEY, updated.getGameState(),
                    "Team " + team.getTeamCode() + " should be in FINAL_PASSKEY state");

            var progress = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
            assertEquals(6, progress.size());
            for (var p : progress) {
                assertEquals(LevelStatus.COMPLETED, p.getLevelStatus(),
                        "All levels for " + team.getTeamCode() + " must be COMPLETED");
            }
        }
    }
}
