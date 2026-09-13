package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AntiCheatEventResponseDto;
import com.technicalescaperoom.backend.dto.player.AntiCheatReportRequest;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.AntiCheatEventRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamAntiCheatSummaryRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AntiCheatServiceTest {

    @Mock
    private AntiCheatEventRepository antiCheatEventRepository;

    @Mock
    private TeamAntiCheatSummaryRepository teamAntiCheatSummaryRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private GameWebSocketPublisher webSocketPublisher;

    @Mock
    private LeaderboardService leaderboardService;

    private AntiCheatService antiCheatService;

    private Event testEvent;
    private Team testTeam;
    private Player player1;
    private Player player2;
    private PlayerPrincipal principalP1;

    @BeforeEach
    void setUp() {
        antiCheatService = new AntiCheatService(
                antiCheatEventRepository,
                teamAntiCheatSummaryRepository,
                teamRepository,
                playerRepository,
                auditService,
                webSocketPublisher,
                leaderboardService
        );

        testEvent = Event.builder()
                .id(1L)
                .name("CodeXcape 2026")
                .status(EventStatus.RUNNING)
                .build();

        testTeam = Team.builder()
                .id(10L)
                .event(testEvent)
                .teamCode("ALPHA")
                .teamName("Alpha Squad")
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .build();

        player1 = Player.builder()
                .id(101L)
                .team(testTeam)
                .displayName("Alice")
                .playerNumber(1)
                .build();

        player2 = Player.builder()
                .id(102L)
                .team(testTeam)
                .displayName("Bob")
                .playerNumber(2)
                .build();

        principalP1 = PlayerPrincipal.builder()
                .playerId(101L)
                .teamId(10L)
                .eventId(1L)
                .playerNumber(1)
                .teamCode("ALPHA")
                .teamName("Alpha Squad")
                .displayName("Alice")
                .build();
    }

    @Test
    @DisplayName("Tab switch violation applies 10 points penalty to team and broadcasts alerts")
    void testProcessPlayerEvent_TabSwitch_AppliesPenalty() {
        when(teamRepository.findById(10L)).thenReturn(Optional.of(testTeam));
        when(playerRepository.findById(101L)).thenReturn(Optional.of(player1));
        when(teamAntiCheatSummaryRepository.findByTeamId(10L)).thenReturn(Optional.empty());

        AntiCheatReportRequest request = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .clientTimestamp(System.currentTimeMillis())
                .metadata("document.hidden")
                .build();

        AntiCheatEventResponseDto response = antiCheatService.processPlayerEvent(principalP1, request);

        assertTrue(response.isAccepted());
        assertFalse(response.isDeduplicated());
        assertEquals(AntiCheatViolationType.TAB_SWITCH, response.getViolationType());
        assertEquals(10, response.getPenaltyPoints());
        assertEquals(10, response.getTeamTotalPenalties());

        // Verify audit event was saved
        verify(antiCheatEventRepository, times(1)).save(any(AntiCheatEvent.class));

        // Verify team summary was updated
        ArgumentCaptor<TeamAntiCheatSummary> summaryCaptor = ArgumentCaptor.forClass(TeamAntiCheatSummary.class);
        verify(teamAntiCheatSummaryRepository, times(1)).saveAndFlush(summaryCaptor.capture());
        TeamAntiCheatSummary savedSummary = summaryCaptor.getValue();
        assertEquals(10, savedSummary.getTotalPenaltyPoints());
        assertEquals(1, savedSummary.getTotalViolations());
        assertEquals(1, savedSummary.getTabSwitchCount());

        // Verify WebSockets and leaderboard recalculation
        verify(webSocketPublisher, times(1)).notifyTeamAntiCheatAlert(eq(10L), eq("ALPHA"), eq(1), eq("TAB_SWITCH"), eq(10), eq(10), anyString());
        verify(webSocketPublisher, times(1)).notifyAdminAntiCheatEvent(eq(10L), eq("ALPHA"), eq(101L), eq(1), eq("Alice"), eq("TAB_SWITCH"), eq(10), eq(10), eq(1), anyString());
        verify(leaderboardService, times(1)).recalculateAndBroadcastRanks(eq(1L), eq(webSocketPublisher));
    }

    @Test
    @DisplayName("Rapid violation of same type within 10s cooldown is deduplicated with 0 penalty")
    void testProcessPlayerEvent_CooldownDeduplication() {
        when(teamRepository.findById(10L)).thenReturn(Optional.of(testTeam));
        when(playerRepository.findById(101L)).thenReturn(Optional.of(player1));
        when(teamAntiCheatSummaryRepository.findByTeamId(10L)).thenReturn(Optional.empty());

        AntiCheatReportRequest request = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .clientTimestamp(System.currentTimeMillis())
                .build();

        // First occurrence -> penalized
        AntiCheatEventResponseDto res1 = antiCheatService.processPlayerEvent(principalP1, request);
        assertTrue(res1.isAccepted());
        assertEquals(10, res1.getPenaltyPoints());

        // Second occurrence immediately -> deduplicated, 0 penalty
        AntiCheatEventResponseDto res2 = antiCheatService.processPlayerEvent(principalP1, request);
        assertFalse(res2.isAccepted());
        assertTrue(res2.isDeduplicated());

        // Ensure audit record was only saved once
        verify(antiCheatEventRepository, times(1)).save(any(AntiCheatEvent.class));
    }

    @Test
    @DisplayName("Tab switch correlated with recent fullscreen exit within 5s is deduplicated")
    void testProcessPlayerEvent_CorrelationWindow_Deduplicated() {
        when(teamRepository.findById(10L)).thenReturn(Optional.of(testTeam));
        when(playerRepository.findById(101L)).thenReturn(Optional.of(player1));
        when(teamAntiCheatSummaryRepository.findByTeamId(10L)).thenReturn(Optional.empty());

        AntiCheatReportRequest fsRequest = AntiCheatReportRequest.builder()
                .eventType("FULLSCREEN_EXIT")
                .clientTimestamp(System.currentTimeMillis())
                .build();

        // 1. Fullscreen exit occurs
        AntiCheatEventResponseDto fsRes = antiCheatService.processPlayerEvent(principalP1, fsRequest);
        assertTrue(fsRes.isAccepted());
        assertEquals(15, fsRes.getPenaltyPoints());

        // 2. Tab switch follows immediately (browser blur/hidden when leaving fullscreen)
        AntiCheatReportRequest tabRequest = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .clientTimestamp(System.currentTimeMillis())
                .build();

        AntiCheatEventResponseDto tabRes = antiCheatService.processPlayerEvent(principalP1, tabRequest);
        assertFalse(tabRes.isAccepted());
        assertTrue(tabRes.isDeduplicated());
        assertTrue(tabRes.getMessage().contains("Correlated with recent fullscreen exit"));
    }

    @Test
    @DisplayName("Events outside IN_PROGRESS gameplay are ignored and not penalized")
    void testProcessPlayerEvent_NotInProgress_Ignored() {
        testTeam.setGameState(TeamGameState.NOT_STARTED);
        when(teamRepository.findById(10L)).thenReturn(Optional.of(testTeam));
        when(playerRepository.findById(101L)).thenReturn(Optional.of(player1));

        AntiCheatReportRequest request = AntiCheatReportRequest.builder()
                .eventType("TAB_SWITCH")
                .clientTimestamp(System.currentTimeMillis())
                .build();

        AntiCheatEventResponseDto response = antiCheatService.processPlayerEvent(principalP1, request);

        assertFalse(response.isAccepted());
        assertFalse(response.isDeduplicated());
        verify(antiCheatEventRepository, never()).save(any());
        verify(teamAntiCheatSummaryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Team penalty belongs to the entire team and aggregates across both players")
    void testProcessPlayerEvent_TeamAggregation_BothPlayers() {
        TeamAntiCheatSummary summary = TeamAntiCheatSummary.builder()
                .teamId(10L)
                .team(testTeam)
                .totalPenaltyPoints(10)
                .totalViolations(1)
                .tabSwitchCount(1)
                .fullscreenExitCount(0)
                .prolongedHiddenCount(0)
                .lastViolationAt(Instant.now().minusSeconds(20))
                .build();

        PlayerPrincipal principalP2 = PlayerPrincipal.builder()
                .playerId(102L)
                .teamId(10L)
                .eventId(1L)
                .playerNumber(2)
                .teamCode("ALPHA")
                .teamName("Alpha Squad")
                .displayName("Bob")
                .build();

        when(teamRepository.findById(10L)).thenReturn(Optional.of(testTeam));
        when(playerRepository.findById(102L)).thenReturn(Optional.of(player2));
        when(teamAntiCheatSummaryRepository.findByTeamId(10L)).thenReturn(Optional.of(summary));

        AntiCheatReportRequest request = AntiCheatReportRequest.builder()
                .eventType("FULLSCREEN_EXIT")
                .clientTimestamp(System.currentTimeMillis())
                .build();

        AntiCheatEventResponseDto response = antiCheatService.processPlayerEvent(principalP2, request);

        assertTrue(response.isAccepted());
        assertEquals(15, response.getPenaltyPoints());
        assertEquals(25, response.getTeamTotalPenalties()); // 10 from P1 + 15 from P2
        assertEquals(25, summary.getTotalPenaltyPoints());
        assertEquals(2, summary.getTotalViolations());
        assertEquals(1, summary.getFullscreenExitCount());
    }
}
