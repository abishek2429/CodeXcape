package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.dto.admin.EventStatisticsDto;
import com.technicalescaperoom.backend.dto.admin.LeaderboardEntryDto;
import com.technicalescaperoom.backend.dto.admin.LevelStatisticsDto;
import com.technicalescaperoom.backend.dto.publicapi.PublicLeaderboardDto;
import com.technicalescaperoom.backend.dto.publicapi.PublicLeaderboardEntryDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<Team> teams = teamRepository.findByEventId(eventId);

        // Partition completed and incomplete teams
        List<Team> completedTeams = teams.stream()
                .filter(t -> t.getGameState() == TeamGameState.COMPLETED && t.getCompletedAt() != null)
                .sorted(Comparator.comparing(Team::getCompletedAt))
                .collect(Collectors.toList());

        List<Team> incompleteTeams = teams.stream()
                .filter(t -> t.getGameState() != TeamGameState.COMPLETED || t.getCompletedAt() == null)
                .collect(Collectors.toList());

        List<LeaderboardEntryDto> result = new ArrayList<>();

        // Rank completed teams
        int rank = 1;
        for (Team team : completedTeams) {
            result.add(buildLeaderboardEntry(event, team, rank++));
        }

        // Add incomplete teams without rank
        for (Team team : incompleteTeams) {
            result.add(buildLeaderboardEntry(event, team, null));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public EventStatisticsDto getEventStatistics(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<Team> teams = teamRepository.findByEventId(eventId);
        long totalRegistered = teams.size();
        long completedCount = teams.stream().filter(t -> t.getGameState() == TeamGameState.COMPLETED).count();
        long notStartedCount = teams.stream().filter(t -> t.getGameState() == TeamGameState.NOT_STARTED).count();
        long startedCount = totalRegistered - notStartedCount;
        long activeCount = teams.stream().filter(t -> t.getGameState() == TeamGameState.IN_PROGRESS || t.getGameState() == TeamGameState.FINAL_PASSKEY).count();

        // Calculate durations for completed teams
        List<Long> durations = new ArrayList<>();
        Instant latestCompletion = null;

        for (Team team : teams) {
            if (team.getGameState() == TeamGameState.COMPLETED && team.getCompletedAt() != null) {
                long duration = calculateDurationSeconds(event, team);
                durations.add(duration);

                if (latestCompletion == null || team.getCompletedAt().isAfter(latestCompletion)) {
                    latestCompletion = team.getCompletedAt();
                }
            }
        }

        Long fastestSeconds = durations.isEmpty() ? null : Collections.min(durations);
        Long averageSeconds = durations.isEmpty() ? null : (long) durations.stream().mapToLong(Long::longValue).average().orElse(0.0);

        // Level breakdown
        List<LevelStatisticsDto> levelBreakdown = new ArrayList<>();
        for (int lvl = 1; lvl <= 6; lvl++) {
            final int currentLvl = lvl;
            long reached = 0;
            long completed = 0;
            long currentlyHere = 0;

            for (Team team : teams) {
                List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
                TeamLevelProgress lvlProgress = progressList.stream()
                        .filter(p -> p.getLevel().getLevelNumber() == currentLvl)
                        .findFirst()
                        .orElse(null);

                if (lvlProgress != null) {
                    if (lvlProgress.getLevelStatus() != LevelStatus.LOCKED) {
                        reached++;
                    }
                    if (lvlProgress.getLevelStatus() == LevelStatus.COMPLETED) {
                        completed++;
                    }
                    if (lvlProgress.getLevelStatus() == LevelStatus.AVAILABLE || lvlProgress.getLevelStatus() == LevelStatus.IN_PROGRESS) {
                        currentlyHere++;
                    }
                } else if (team.getGameState() == TeamGameState.FINAL_PASSKEY && currentLvl == 6) {
                    currentlyHere++;
                } else if (team.getGameState() == TeamGameState.COMPLETED) {
                    reached++;
                    completed++;
                }
            }

            levelBreakdown.add(LevelStatisticsDto.builder()
                    .levelNumber(lvl)
                    .levelName("Level " + lvl)
                    .teamsReached(reached)
                    .teamsCompleted(completed)
                    .currentlyHere(currentlyHere)
                    .build());
        }

        return EventStatisticsDto.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .eventStatus(event.getStatus().name())
                .totalRegisteredTeams(totalRegistered)
                .startedTeams(startedCount)
                .activeTeams(activeCount)
                .completedTeams(completedCount)
                .notStartedTeams(notStartedCount)
                .disconnectedTeams(0L)
                .fastestCompletionSeconds(fastestSeconds)
                .formattedFastestCompletion(formatDuration(fastestSeconds))
                .averageCompletionSeconds(averageSeconds)
                .formattedAverageCompletion(formatDuration(averageSeconds))
                .latestCompletionTime(latestCompletion)
                .levelBreakdown(levelBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public PublicLeaderboardDto getPublicLeaderboard(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<LeaderboardEntryDto> fullLeaderboard = getLeaderboard(eventId);

        List<PublicLeaderboardEntryDto> completedEntries = fullLeaderboard.stream()
                .filter(e -> e.getGameState() == TeamGameState.COMPLETED)
                .map(e -> PublicLeaderboardEntryDto.builder()
                        .rank(e.getRank())
                        .teamName(e.getTeamName())
                        .status("COMPLETED")
                        .currentLevel(6)
                        .formattedDuration(e.getFormattedDuration())
                        .build())
                .collect(Collectors.toList());

        List<PublicLeaderboardEntryDto> activeEntries = fullLeaderboard.stream()
                .filter(e -> e.getGameState() != TeamGameState.COMPLETED)
                .map(e -> PublicLeaderboardEntryDto.builder()
                        .rank(null)
                        .teamName(e.getTeamName())
                        .status(e.getGameState().name())
                        .currentLevel(e.getCurrentLevel())
                        .formattedDuration("-")
                        .build())
                .collect(Collectors.toList());

        return PublicLeaderboardDto.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .eventStatus(event.getStatus().name())
                .completedEntries(completedEntries)
                .activeEntries(activeEntries)
                .build();
    }

    private LeaderboardEntryDto buildLeaderboardEntry(Event event, Team team, Integer rank) {
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        int currentLevel = (activeProgress != null) ? activeProgress.getLevel().getLevelNumber() : (team.getGameState() == TeamGameState.COMPLETED ? 6 : 1);

        List<Player> players = playerRepository.findByTeamId(team.getId());
        Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
        Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

        Long durationSeconds = null;
        String formattedDuration = "-";

        if (team.getGameState() == TeamGameState.COMPLETED && team.getCompletedAt() != null) {
            durationSeconds = calculateDurationSeconds(event, team);
            formattedDuration = formatDuration(durationSeconds);
        }

        return LeaderboardEntryDto.builder()
                .rank(rank)
                .teamId(team.getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .status(team.getStatus())
                .gameState(team.getGameState())
                .currentLevel(currentLevel)
                .player1Name(p1 != null ? p1.getDisplayName() : "Player 1")
                .player2Name(p2 != null ? p2.getDisplayName() : "Player 2")
                .completedAt(team.getCompletedAt())
                .durationSeconds(durationSeconds)
                .formattedDuration(formattedDuration)
                .build();
    }

    private long calculateDurationSeconds(Event event, Team team) {
        Instant startTime = (event.getStartTime() != null) ? event.getStartTime() : team.getCreatedAt();
        if (startTime == null) startTime = team.getCreatedAt();
        Instant endTime = (team.getCompletedAt() != null) ? team.getCompletedAt() : Instant.now();

        long diff = Duration.between(startTime, endTime).getSeconds();
        return Math.max(0, diff);
    }

    private String formatDuration(Long totalSeconds) {
        if (totalSeconds == null) return "-";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        if (hours > 0) {
            return String.format("%dh %02dm %02ds", hours, minutes, seconds);
        }
        return String.format("%02dm %02ds", minutes, seconds);
    }
}
