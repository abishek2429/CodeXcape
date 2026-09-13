package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardRankingWithAntiCheatTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Mock
    private TeamAntiCheatSummaryRepository teamAntiCheatSummaryRepository;

    private LeaderboardService leaderboardService;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        leaderboardService = new LeaderboardService(
                eventRepository,
                teamRepository,
                playerRepository,
                teamLevelProgressRepository,
                teamAntiCheatSummaryRepository
        );

        testEvent = Event.builder()
                .id(1L)
                .name("CodeXcape 2026")
                .status(EventStatus.RUNNING)
                .build();

        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(playerRepository.findByTeamIdIn(any())).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Completed team ranks above In-Progress team regardless of anti-cheat penalties")
    void testCompletedRanksAboveInProgress() {
        Instant now = Instant.now();

        // Team 1: Completed, but has 40 penalty points
        Team teamCompleted = Team.builder()
                .id(1L)
                .event(testEvent)
                .teamCode("T-COMPLETED")
                .teamName("Finished Team")
                .status(TeamStatus.COMPLETED)
                .gameState(TeamGameState.COMPLETED)
                .startedAt(now.minusSeconds(1000))
                .completedAt(now.minusSeconds(100))
                .createdAt(now.minusSeconds(1000))
                .build();

        // Team 2: In progress at Level 5 with 0 penalties
        Team teamInProgress = Team.builder()
                .id(2L)
                .event(testEvent)
                .teamCode("T-PROGRESS")
                .teamName("Progress Team")
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .startedAt(now.minusSeconds(1000))
                .createdAt(now.minusSeconds(1000))
                .build();

        when(teamRepository.findByEventId(1L)).thenReturn(Arrays.asList(teamInProgress, teamCompleted));
        when(teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(any())).thenReturn(Collections.emptyList());

        TeamAntiCheatSummary summaryCompleted = TeamAntiCheatSummary.builder()
                .teamId(1L)
                .team(teamCompleted)
                .totalPenaltyPoints(40)
                .totalViolations(3)
                .build();

        when(teamAntiCheatSummaryRepository.findByTeamIdIn(any())).thenReturn(List.of(summaryCompleted));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(1L);

        assertEquals(2, leaderboard.size());
        assertEquals("T-COMPLETED", leaderboard.get(0).getTeamCode(), "Completed team must rank #1");
        assertEquals("T-PROGRESS", leaderboard.get(1).getTeamCode(), "In-progress team must rank #2");
    }

    @Test
    @DisplayName("Between two completed teams, team with fewer penalties ranks higher")
    void testCompletedTeams_FewerPenaltiesRanksHigher() {
        Instant now = Instant.now();

        // Team Clean: 0 penalties, finished at T+500s
        Team teamClean = Team.builder()
                .id(1L)
                .event(testEvent)
                .teamCode("T-CLEAN")
                .teamName("Clean Team")
                .status(TeamStatus.COMPLETED)
                .gameState(TeamGameState.COMPLETED)
                .startedAt(now.minusSeconds(1000))
                .completedAt(now.minusSeconds(500))
                .createdAt(now.minusSeconds(1000))
                .build();

        // Team Penalized: 30 penalty points, finished earlier at T+600s
        Team teamPenalized = Team.builder()
                .id(2L)
                .event(testEvent)
                .teamCode("T-PENALIZED")
                .teamName("Cheater Team")
                .status(TeamStatus.COMPLETED)
                .gameState(TeamGameState.COMPLETED)
                .startedAt(now.minusSeconds(1000))
                .completedAt(now.minusSeconds(600))
                .createdAt(now.minusSeconds(1000))
                .build();

        when(teamRepository.findByEventId(1L)).thenReturn(Arrays.asList(teamPenalized, teamClean));
        when(teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(any())).thenReturn(Collections.emptyList());

        TeamAntiCheatSummary summaryPenalized = TeamAntiCheatSummary.builder()
                .teamId(2L)
                .team(teamPenalized)
                .totalPenaltyPoints(30)
                .totalViolations(2)
                .build();

        when(teamAntiCheatSummaryRepository.findByTeamIdIn(any())).thenReturn(List.of(summaryPenalized));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(1L);

        assertEquals(2, leaderboard.size());
        assertEquals("T-CLEAN", leaderboard.get(0).getTeamCode(), "Team with 0 penalties must rank #1");
        assertEquals("T-PENALIZED", leaderboard.get(1).getTeamCode(), "Team with 30 penalties must rank #2");
        assertEquals(0, leaderboard.get(0).getAntiCheatPenalties());
        assertEquals(30, leaderboard.get(1).getAntiCheatPenalties());
    }

    @Test
    @DisplayName("Between in-progress teams at the same level, team with fewer penalties ranks higher")
    void testInProgressTeams_TiedLevel_FewerPenaltiesRanksHigher() {
        Instant now = Instant.now();

        Team teamClean = Team.builder()
                .id(1L)
                .event(testEvent)
                .teamCode("T-CLEAN")
                .teamName("Clean Team")
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .createdAt(now.minusSeconds(1000))
                .build();

        Team teamPenalized = Team.builder()
                .id(2L)
                .event(testEvent)
                .teamCode("T-PENALIZED")
                .teamName("Penalized Team")
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .createdAt(now.minusSeconds(1000))
                .build();

        when(teamRepository.findByEventId(1L)).thenReturn(Arrays.asList(teamPenalized, teamClean));
        when(teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(any())).thenReturn(Collections.emptyList());

        TeamAntiCheatSummary summaryPenalized = TeamAntiCheatSummary.builder()
                .teamId(2L)
                .team(teamPenalized)
                .totalPenaltyPoints(20)
                .totalViolations(2)
                .build();

        when(teamAntiCheatSummaryRepository.findByTeamIdIn(any())).thenReturn(List.of(summaryPenalized));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(1L);

        assertEquals(2, leaderboard.size());
        assertEquals("T-CLEAN", leaderboard.get(0).getTeamCode(), "Clean team must rank higher than penalized team at same level");
        assertEquals("T-PENALIZED", leaderboard.get(1).getTeamCode());
    }
}
