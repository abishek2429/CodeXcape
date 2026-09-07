package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.AdminActiveSessionDto;
import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final GameSessionRepository gameSessionRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponseDto getDashboardStats(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<Team> teams = teamRepository.findByEventId(eventId);
        long totalTeams = teams.size();
        long completedTeams = teams.stream().filter(t -> t.getGameState() == TeamGameState.COMPLETED).count();
        long activeTeams = totalTeams - completedTeams;

        long bothOnline = 0;
        long oneOffline = 0;
        long bothOffline = 0;
        long disconnectedCount = 0;
        long totalLoggedInTeams = 0;
        long totalActiveSessions = 0;

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 6; i++) {
            distribution.put(i, 0L);
        }

        for (Team team : teams) {
            List<Player> players = playerRepository.findByTeamId(team.getId());
            Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
            Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

            GameSession s1 = p1 != null ? gameSessionRepository.findByPlayerIdAndStatus(p1.getId(), SessionStatus.ACTIVE).orElse(null) : null;
            GameSession s2 = p2 != null ? gameSessionRepository.findByPlayerIdAndStatus(p2.getId(), SessionStatus.ACTIVE).orElse(null) : null;

            boolean p1LoggedIn = s1 != null;
            boolean p2LoggedIn = s2 != null;
            if (p1LoggedIn) totalActiveSessions++;
            if (p2LoggedIn) totalActiveSessions++;
            if (p1LoggedIn || p2LoggedIn) totalLoggedInTeams++;

            boolean p1Connected = p1LoggedIn && Boolean.TRUE.equals(s1.getIsConnected());
            boolean p2Connected = p2LoggedIn && Boolean.TRUE.equals(s2.getIsConnected());

            if (p1 != null && !p1Connected) disconnectedCount++;
            if (p2 != null && !p2Connected) disconnectedCount++;

            if (p1Connected && p2Connected) {
                bothOnline++;
            } else if (!p1Connected && !p2Connected) {
                bothOffline++;
            } else {
                oneOffline++;
            }

            List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
            TeamLevelProgress activeProgress = progressList.stream()
                    .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                    .findFirst()
                    .orElse(null);

            if (activeProgress != null) {
                int levelNum = activeProgress.getLevel().getLevelNumber();
                distribution.put(levelNum, distribution.getOrDefault(levelNum, 0L) + 1);
            } else if (team.getGameState() == TeamGameState.FINAL_PASSKEY) {
                distribution.put(6, distribution.getOrDefault(6, 0L) + 1);
            }
        }

        Long durationSeconds = null;
        if (event.getStartTime() != null) {
            java.time.Instant endOrNow = event.getEndTime() != null ? event.getEndTime() : java.time.Instant.now();
            durationSeconds = java.time.Duration.between(event.getStartTime(), endOrNow).getSeconds();
        }

        return AdminDashboardResponseDto.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .eventStatus(event.getStatus())
                .totalTeams(totalTeams)
                .activeTeams(activeTeams)
                .completedTeams(completedTeams)
                .disconnectedPlayers(disconnectedCount)
                .bothPlayersOnlineTeams(bothOnline)
                .onePlayerOfflineTeams(oneOffline)
                .bothPlayersOfflineTeams(bothOffline)
                .totalLoggedInTeams(totalLoggedInTeams)
                .totalActiveSessions(totalActiveSessions)
                .serverStatus("ONLINE")
                .eventDurationSeconds(durationSeconds)
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .levelDistribution(distribution)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminActiveSessionDto> getActiveSessions(Long eventId) {
        List<Team> teams = teamRepository.findByEventId(eventId);
        List<AdminActiveSessionDto> sessionDtos = new ArrayList<>();

        for (Team team : teams) {
            List<Player> players = playerRepository.findByTeamId(team.getId());
            for (Player player : players) {
                Optional<GameSession> activeSessionOpt = gameSessionRepository.findByPlayerIdAndStatus(player.getId(), SessionStatus.ACTIVE);
                if (activeSessionOpt.isPresent()) {
                    GameSession session = activeSessionOpt.get();
                    String token = session.getSessionToken();
                    String preview = token != null && token.length() > 8 ? token.substring(0, 8) + "..." : token;

                    sessionDtos.add(AdminActiveSessionDto.builder()
                            .sessionId(session.getId())
                            .teamId(team.getId())
                            .teamCode(team.getTeamCode())
                            .teamName(team.getTeamName())
                            .playerId(player.getId())
                            .playerNumber(player.getPlayerNumber())
                            .playerName(player.getDisplayName())
                            .playerRole(player.getPlayerNumber() == 1 ? "OPERATOR" : "ANALYZER")
                            .playerStatus(player.getStatus())
                            .isReady(Boolean.TRUE.equals(player.getIsReady()))
                            .sessionToken(token)
                            .sessionTokenPreview(preview)
                            .sessionStatus(session.getStatus())
                            .isConnected(session.getIsConnected())
                            .createdAt(session.getCreatedAt())
                            .lastActivityAt(session.getLastActivityAt())
                            .teamGameState(team.getGameState())
                            .build());
                }
            }
        }

        return sessionDtos;
    }

    @Transactional(readOnly = true)
    public List<AdminTeamProgressDto> getTeamsProgress(Long eventId, String search, Integer levelFilter) {
        return getTeamsProgress(eventId, search, levelFilter, null);
    }

    @Transactional(readOnly = true)
    public List<AdminTeamProgressDto> getTeamsProgress(Long eventId, String search, Integer levelFilter, String statusFilter) {
        List<Team> teams = teamRepository.findByEventId(eventId);
        List<AdminTeamProgressDto> dtos = new ArrayList<>();

        for (Team team : teams) {
            List<Player> players = playerRepository.findByTeamId(team.getId());
            Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
            Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

            GameSession s1 = p1 != null ? gameSessionRepository.findByPlayerIdAndStatus(p1.getId(), SessionStatus.ACTIVE).orElse(null) : null;
            GameSession s2 = p2 != null ? gameSessionRepository.findByPlayerIdAndStatus(p2.getId(), SessionStatus.ACTIVE).orElse(null) : null;

            boolean p1LoggedIn = s1 != null;
            boolean p2LoggedIn = s2 != null;
            int activeSessionsCount = (p1LoggedIn ? 1 : 0) + (p2LoggedIn ? 1 : 0);
            boolean teamSessionActive = activeSessionsCount > 0;

            boolean p1Online = p1LoggedIn && Boolean.TRUE.equals(s1.getIsConnected());
            boolean p2Online = p2LoggedIn && Boolean.TRUE.equals(s2.getIsConnected());

            String connStatus;
            if (p1Online && p2Online) {
                connStatus = "BOTH_ONLINE";
            } else if (p1Online || p2Online) {
                connStatus = "ONE_ONLINE";
            } else if (p1LoggedIn || p2LoggedIn) {
                connStatus = "WAITING";
            } else {
                connStatus = "OFFLINE";
            }

            if (search != null && !search.isBlank()) {
                String term = search.toLowerCase().trim();
                boolean matches = team.getTeamName().toLowerCase().contains(term) || team.getTeamCode().toLowerCase().contains(term)
                        || (p1 != null && p1.getDisplayName().toLowerCase().contains(term))
                        || (p2 != null && p2.getDisplayName().toLowerCase().contains(term));
                if (!matches) continue;
            }

            List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
            TeamLevelProgress activeProgress = progressList.stream()
                    .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                    .findFirst()
                    .orElse(null);

            int currentLevelNum = (activeProgress != null) ? activeProgress.getLevel().getLevelNumber() : (team.getGameState() == TeamGameState.COMPLETED ? 6 : 1);
            if (levelFilter != null && levelFilter != currentLevelNum) {
                continue;
            }

            if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
                String filterUpper = statusFilter.toUpperCase().trim();
                if (filterUpper.equals("COMPLETED") && team.getGameState() != TeamGameState.COMPLETED) continue;
                if (filterUpper.equals("IN_PROGRESS") && team.getGameState() == TeamGameState.COMPLETED) continue;
                if (filterUpper.equals("ONLINE") && !connStatus.equals("BOTH_ONLINE")) continue;
                if (filterUpper.equals("OFFLINE") && !connStatus.equals("OFFLINE")) continue;
                if (filterUpper.equals("LOGGED_IN") && !teamSessionActive) continue;
            }

            long hintsUnlocked = progressList.stream().filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED).count();

            AdminTeamProgressDto dto = AdminTeamProgressDto.builder()
                    .teamId(team.getId())
                    .teamCode(team.getTeamCode())
                    .teamName(team.getTeamName())
                    .status(team.getStatus())
                    .gameState(team.getGameState())
                    .currentLevel(currentLevelNum)
                    .player1Completed(activeProgress != null ? activeProgress.getPlayer1Completed() : true)
                    .player2Completed(activeProgress != null ? activeProgress.getPlayer2Completed() : true)
                    .player1Name(p1 != null ? p1.getDisplayName() : "Player 1")
                    .player2Name(p2 != null ? p2.getDisplayName() : "Player 2")
                    .player1Connected(p1Online)
                    .player2Connected(p2Online)
                    .connectionStatus(connStatus)
                    .player1SessionId(s1 != null ? s1.getId() : null)
                    .player2SessionId(s2 != null ? s2.getId() : null)
                    .hintsUnlocked((int) hintsUnlocked)
                    .completedAt(team.getCompletedAt())
                    // Session monitoring fields
                    .isLoggedIn(teamSessionActive)
                    .activeSessionsCount(activeSessionsCount)
                    .teamSessionActive(teamSessionActive)
                    .player1Status(p1 != null ? p1.getStatus().name() : null)
                    .player1LoggedIn(p1LoggedIn)
                    .player1Ready(p1 != null && Boolean.TRUE.equals(p1.getIsReady()))
                    .player1SessionToken(s1 != null ? (s1.getSessionToken().length() > 8 ? s1.getSessionToken().substring(0, 8) + "..." : s1.getSessionToken()) : null)
                    .player1LoginTime(s1 != null ? s1.getCreatedAt() : null)
                    .player1LastActivity(s1 != null ? s1.getLastActivityAt() : null)
                    .player2Status(p2 != null ? p2.getStatus().name() : null)
                    .player2LoggedIn(p2LoggedIn)
                    .player2Ready(p2 != null && Boolean.TRUE.equals(p2.getIsReady()))
                    .player2SessionToken(s2 != null ? (s2.getSessionToken().length() > 8 ? s2.getSessionToken().substring(0, 8) + "..." : s2.getSessionToken()) : null)
                    .player2LoginTime(s2 != null ? s2.getCreatedAt() : null)
                    .player2LastActivity(s2 != null ? s2.getLastActivityAt() : null)
                    .build();

            dtos.add(dto);
        }

        return dtos;
    }

    private boolean isPlayerOnline(Player player) {
        if (player == null) return false;
        return gameSessionRepository.findByPlayerIdAndStatus(player.getId(), SessionStatus.ACTIVE)
                .map(s -> Boolean.TRUE.equals(s.getIsConnected()))
                .orElse(false);
    }
}
