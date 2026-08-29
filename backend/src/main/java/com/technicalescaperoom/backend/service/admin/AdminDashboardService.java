package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto;
import com.technicalescaperoom.backend.dto.admin.AdminTeamProgressDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.LevelStatus;
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

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 6; i++) {
            distribution.put(i, 0L);
        }

        for (Team team : teams) {
            List<Player> players = playerRepository.findByTeamId(team.getId());
            Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
            Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

            boolean p1Connected = isPlayerOnline(p1);
            boolean p2Connected = isPlayerOnline(p2);

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
                .serverStatus("ONLINE")
                .eventDurationSeconds(durationSeconds)
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .levelDistribution(distribution)
                .build();
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

            boolean p1Online = isPlayerOnline(p1);
            boolean p2Online = isPlayerOnline(p2);
            String connStatus = (p1Online && p2Online) ? "BOTH_ONLINE" : (!p1Online && !p2Online ? "BOTH_OFFLINE" : "ONE_OFFLINE");

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
                if (filterUpper.equals("OFFLINE") && connStatus.equals("BOTH_ONLINE")) continue;
            }

            long hintsUnlocked = progressList.stream().filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED).count();

            GameSession s1 = p1 != null ? gameSessionRepository.findTopByPlayerIdOrderByCreatedAtDesc(p1.getId()).orElse(null) : null;
            GameSession s2 = p2 != null ? gameSessionRepository.findTopByPlayerIdOrderByCreatedAtDesc(p2.getId()).orElse(null) : null;

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
                    .build();

            dtos.add(dto);
        }

        return dtos;
    }

    private boolean isPlayerOnline(Player player) {
        if (player == null) return false;
        return gameSessionRepository.findTopByPlayerIdOrderByCreatedAtDesc(player.getId())
                .map(s -> Boolean.TRUE.equals(s.getIsConnected()) && s.getStatus() == com.technicalescaperoom.backend.enums.SessionStatus.ACTIVE)
                .orElse(false);
    }
}
