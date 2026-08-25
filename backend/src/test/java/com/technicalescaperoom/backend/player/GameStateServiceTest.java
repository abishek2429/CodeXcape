package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.CurrentLevelDto;
import com.technicalescaperoom.backend.dto.player.PlayerGameStateDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class GameStateServiceTest {

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
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    private Event readyEvent;
    private Team teamA;
    private Team teamB;
    private Player playerA1;
    private Player playerB1;

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();

        // 1. Create READY Event
        readyEvent = eventRepository.save(Event.builder()
                .name("Core Game State Test Event 2026")
                .description("Test Event")
                .status(EventStatus.READY)
                .passkeyHash("passkey123")
                .build());

        // 2. Ensure 6 Active Levels exist in database
        for (int i = 1; i <= 6; i++) {
            final int lvlNum = i;
            levelRepository.findByLevelNumber(lvlNum).orElseGet(() -> levelRepository.save(Level.builder()
                    .levelNumber(lvlNum)
                    .name("Level " + lvlNum + ": Test Challenge")
                    .description("Test challenge description " + lvlNum)
                    .difficulty("EASY")
                    .isActive(true)
                    .build()));
        }

        // 3. Create Team A & Team B
        teamA = teamRepository.save(Team.builder()
                .event(readyEvent)
                .teamCode("TEAM-001")
                .teamName("Alpha Team")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(1)
                .displayName("Player A1")
                .status(PlayerStatus.INACTIVE)
                .build());

        teamB = teamRepository.save(Team.builder()
                .event(readyEvent)
                .teamCode("TEAM-002")
                .teamName("Beta Team")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder()
                .team(teamB)
                .playerNumber(1)
                .displayName("Player B1")
                .status(PlayerStatus.INACTIVE)
                .build());
    }

    @Test
    @DisplayName("1. Initializing team game state creates Level 1 AVAILABLE and Levels 2-6 LOCKED")
    void testInitializeTeamGameState() {
        var progressList = gameStateService.initializeTeamGameState(teamA);

        assertEquals(6, progressList.size());
        assertEquals(LevelStatus.AVAILABLE, progressList.get(0).getLevelStatus());
        for (int i = 1; i < 6; i++) {
            assertEquals(LevelStatus.LOCKED, progressList.get(i).getLevelStatus());
        }

        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(TeamGameState.IN_PROGRESS, updatedTeam.getGameState());
    }

    @Test
    @DisplayName("2. Sequential level completion progresses L1 -> L2 -> ... -> L6 -> FINAL_PASSKEY")
    void testSequentialLevelProgression() {
        gameStateService.initializeTeamGameState(teamA);

        // Complete L1
        gameStateService.completeLevel(teamA.getId(), 1);
        PlayerGameStateDto stateAfterL1 = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(2, stateAfterL1.getCurrentLevel());
        assertEquals(LevelStatus.COMPLETED, stateAfterL1.getLevels().get(0).getStatus());
        assertEquals(LevelStatus.AVAILABLE, stateAfterL1.getLevels().get(1).getStatus());

        // Complete L2 to L5
        for (int i = 2; i <= 5; i++) {
            gameStateService.completeLevel(teamA.getId(), i);
        }

        PlayerGameStateDto stateAfterL5 = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(6, stateAfterL5.getCurrentLevel());

        // Complete L6 -> Transition to FINAL_PASSKEY
        gameStateService.completeLevel(teamA.getId(), 6);
        PlayerGameStateDto stateAfterL6 = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(TeamGameState.FINAL_PASSKEY, stateAfterL6.getGameStatus());
    }

    @Test
    @DisplayName("3. Server-side prevention of level skipping: attempting to complete locked Level 3 on L1 throws Exception")
    void testPreventLevelSkipping() {
        gameStateService.initializeTeamGameState(teamA);

        assertThrows(InvalidLevelTransitionException.class, () -> {
            gameStateService.completeLevel(teamA.getId(), 3);
        });

        // Verify team state remains on Level 1
        PlayerGameStateDto state = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(1, state.getCurrentLevel());
    }

    @Test
    @DisplayName("4. Repeated completion of the same level is idempotent and safe")
    void testRepeatedCompletionIdempotency() {
        gameStateService.initializeTeamGameState(teamA);

        // Complete Level 1 twice
        gameStateService.completeLevel(teamA.getId(), 1);
        gameStateService.completeLevel(teamA.getId(), 1);

        PlayerGameStateDto state = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(2, state.getCurrentLevel());
        assertEquals(LevelStatus.COMPLETED, state.getLevels().get(0).getStatus());
        assertEquals(LevelStatus.AVAILABLE, state.getLevels().get(1).getStatus());
    }

    @Test
    @DisplayName("5. Team Isolation: Team A cannot access or alter Team B's game state")
    void testTeamIsolation() {
        gameStateService.initializeTeamGameState(teamA);
        gameStateService.initializeTeamGameState(teamB);

        // Complete Level 1 for Team A
        gameStateService.completeLevel(teamA.getId(), 1);

        // Check Team A state
        PlayerGameStateDto stateA = gameStateService.getGameStateForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(2, stateA.getCurrentLevel());

        // Check Team B state (Must remain on Level 1)
        PlayerGameStateDto stateB = gameStateService.getGameStateForPlayer(createPrincipal(playerB1, teamB));
        assertEquals(1, stateB.getCurrentLevel());
    }

    @Test
    @DisplayName("6. Event state restrictions: blocked when event is in DRAFT status")
    void testEventStateRestrictions() {
        readyEvent.setStatus(EventStatus.DRAFT);
        eventRepository.save(readyEvent);

        assertThrows(EventUnavailableException.class, () -> {
            gameStateService.getCurrentLevelForPlayer(createPrincipal(playerA1, teamA));
        });
    }

    @Test
    @DisplayName("7. Authorized getCurrentLevelForPlayer returns metadata strictly for current active level")
    void testGetCurrentLevelForPlayer() {
        gameStateService.initializeTeamGameState(teamA);

        CurrentLevelDto currentLvl = gameStateService.getCurrentLevelForPlayer(createPrincipal(playerA1, teamA));
        assertNotNull(currentLvl);
        assertEquals(1, currentLvl.getLevelNumber());

        // Complete L1 -> now current level should be 2
        gameStateService.completeLevel(teamA.getId(), 1);

        CurrentLevelDto currentLvl2 = gameStateService.getCurrentLevelForPlayer(createPrincipal(playerA1, teamA));
        assertEquals(2, currentLvl2.getLevelNumber());
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
                .sessionToken("test-token-" + player.getId())
                .build();
    }
}
