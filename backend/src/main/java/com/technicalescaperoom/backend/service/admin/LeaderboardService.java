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
    private final TeamAntiCheatSummaryRepository teamAntiCheatSummaryRepository;

    private final Map<Long, Integer> lastBroadcastRanks = new java.util.concurrent.ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<Team> teams = teamRepository.findByEventId(eventId);
        if (teams.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        List<TeamLevelProgress> allProgress = teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(teamIds);
        Map<Long, List<TeamLevelProgress>> progressByTeam = allProgress.stream()
                .collect(Collectors.groupingBy(p -> p.getTeam().getId()));

        Map<Long, TeamAntiCheatSummary> summaryByTeam = teamAntiCheatSummaryRepository.findByTeamIdIn(teamIds).stream()
                .collect(Collectors.toMap(TeamAntiCheatSummary::getTeamId, s -> s));

        Map<Long, Integer> levelMap = preloadTeamLevels(teams, progressByTeam);
        Map<Long, Integer> scoreMap = preloadTeamScores(teams, levelMap, summaryByTeam);
        teams.sort(getFastTeamComparator(levelMap, scoreMap));

        List<Player> allPlayers = playerRepository.findByTeamIdIn(teamIds);
        Map<Long, List<Player>> playersByTeam = allPlayers.stream()
                .collect(Collectors.groupingBy(p -> p.getTeam().getId()));

        List<LeaderboardEntryDto> result = new ArrayList<>();
        int rank = 1;
        for (Team team : teams) {
            result.add(buildLeaderboardEntry(event, team, rank++,
                    progressByTeam.getOrDefault(team.getId(), Collections.emptyList()),
                    playersByTeam.getOrDefault(team.getId(), Collections.emptyList()),
                    summaryByTeam.get(team.getId()),
                    scoreMap.getOrDefault(team.getId(), 1000)));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Integer getTeamCurrentRank(Long teamId) {
        Integer cachedRank = lastBroadcastRanks.get(teamId);
        if (cachedRank != null) {
            return cachedRank;
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        List<Team> allTeams = teamRepository.findByEventId(team.getEvent().getId());
        if (allTeams.isEmpty()) {
            return null;
        }

        List<Long> teamIds = allTeams.stream().map(Team::getId).toList();
        List<TeamLevelProgress> allProgress = teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(teamIds);
        Map<Long, List<TeamLevelProgress>> progressByTeam = allProgress.stream()
                .collect(Collectors.groupingBy(p -> p.getTeam().getId()));

        Map<Long, TeamAntiCheatSummary> summaryByTeam = teamAntiCheatSummaryRepository.findByTeamIdIn(teamIds).stream()
                .collect(Collectors.toMap(TeamAntiCheatSummary::getTeamId, s -> s));

        Map<Long, Integer> levelMap = preloadTeamLevels(allTeams, progressByTeam);
        Map<Long, Integer> scoreMap = preloadTeamScores(allTeams, levelMap, summaryByTeam);
        allTeams.sort(getFastTeamComparator(levelMap, scoreMap));

        for (int i = 0; i < allTeams.size(); i++) {
            lastBroadcastRanks.put(allTeams.get(i).getId(), i + 1);
        }
        return lastBroadcastRanks.get(teamId);
    }

    public void recalculateAndBroadcastRanks(Long eventId, com.technicalescaperoom.backend.service.GameWebSocketPublisher webSocketPublisher) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        executeRecalculation(eventId, webSocketPublisher);
                    }
                }
            );
        } else {
            executeRecalculation(eventId, webSocketPublisher);
        }
    }

    private synchronized void executeRecalculation(Long eventId, com.technicalescaperoom.backend.service.GameWebSocketPublisher webSocketPublisher) {
        List<Team> allTeams = teamRepository.findByEventId(eventId);
        if (allTeams.isEmpty()) {
            return;
        }

        List<Long> teamIds = allTeams.stream().map(Team::getId).toList();
        List<TeamLevelProgress> allProgress = teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(teamIds);
        Map<Long, List<TeamLevelProgress>> progressByTeam = allProgress.stream()
                .collect(Collectors.groupingBy(p -> p.getTeam().getId()));

        Map<Long, TeamAntiCheatSummary> summaryByTeam = teamAntiCheatSummaryRepository.findByTeamIdIn(teamIds).stream()
                .collect(Collectors.toMap(TeamAntiCheatSummary::getTeamId, s -> s));

        Map<Long, Integer> levelMap = preloadTeamLevels(allTeams, progressByTeam);
        Map<Long, Integer> scoreMap = preloadTeamScores(allTeams, levelMap, summaryByTeam);
        allTeams.sort(getFastTeamComparator(levelMap, scoreMap));

        for (int i = 0; i < allTeams.size(); i++) {
            Team team = allTeams.get(i);
            int newRank = i + 1;
            Integer prevRank = lastBroadcastRanks.get(team.getId());
            if (prevRank == null || !prevRank.equals(newRank)) {
                lastBroadcastRanks.put(team.getId(), newRank);
                webSocketPublisher.notifyRankChanged(team.getId(), newRank);
            }
        }
    }

    private Map<Long, Integer> preloadTeamScores(List<Team> teams, Map<Long, Integer> levelMap, Map<Long, TeamAntiCheatSummary> summaryByTeam) {
        Map<Long, Integer> scoreMap = new HashMap<>();
        for (Team team : teams) {
            int level = levelMap.getOrDefault(team.getId(), 1);
            int baseScore = 1000 + (level * 100);
            TeamAntiCheatSummary summary = summaryByTeam.get(team.getId());
            int antiCheatPenalties = (summary != null) ? summary.getTotalPenaltyPoints() : 0;
            scoreMap.put(team.getId(), Math.max(0, baseScore - antiCheatPenalties));
        }
        return scoreMap;
    }

    private Map<Long, Integer> preloadTeamLevels(List<Team> teams, Map<Long, List<TeamLevelProgress>> progressByTeam) {
        Map<Long, Integer> levelMap = new HashMap<>();
        for (Team team : teams) {
            if (team.getGameState() == TeamGameState.COMPLETED || team.getGameState() == TeamGameState.FINAL_PASSKEY) {
                levelMap.put(team.getId(), 6);
            } else {
                List<TeamLevelProgress> progressList = progressByTeam.getOrDefault(team.getId(), Collections.emptyList());
                int lvl = progressList.stream()
                        .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                        .map(p -> p.getLevel().getLevelNumber())
                        .findFirst()
                        .orElse(1);
                levelMap.put(team.getId(), lvl);
            }
        }
        return levelMap;
    }

    private Comparator<Team> getFastTeamComparator(Map<Long, Integer> levelMap, Map<Long, Integer> scoreMap) {
        return (t1, t2) -> {
            boolean t1Completed = t1.getGameState() == TeamGameState.COMPLETED && t1.getCompletedAt() != null;
            boolean t2Completed = t2.getGameState() == TeamGameState.COMPLETED && t2.getCompletedAt() != null;
            
            // 1. Completion Status
            if (t1Completed && !t2Completed) return -1;
            if (!t1Completed && t2Completed) return 1;
            
            if (t1Completed && t2Completed) {
                // If both completed, compare competitive score first (fewer penalties wins)
                int s1 = scoreMap.getOrDefault(t1.getId(), 0);
                int s2 = scoreMap.getOrDefault(t2.getId(), 0);
                if (s1 != s2) {
                    return Integer.compare(s2, s1); // Descending
                }
                return t1.getCompletedAt().compareTo(t2.getCompletedAt());
            }
            
            // 2. Both in-progress, sort by highest active level
            int t1Level = levelMap.getOrDefault(t1.getId(), 1);
            int t2Level = levelMap.getOrDefault(t2.getId(), 1);
            if (t1Level != t2Level) {
                return Integer.compare(t2Level, t1Level); // Descending
            }
            
            // 3. If tied on level, sort by competitive score (fewer penalties wins)
            int s1 = scoreMap.getOrDefault(t1.getId(), 0);
            int s2 = scoreMap.getOrDefault(t2.getId(), 0);
            if (s1 != s2) {
                return Integer.compare(s2, s1); // Descending
            }
            
            // 4. Stable sort by ID
            return t1.getId().compareTo(t2.getId());
        };
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

        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        List<TeamLevelProgress> allProgress = teamIds.isEmpty() ? Collections.emptyList() :
                teamLevelProgressRepository.findByTeamIdInOrderByLevelIdAsc(teamIds);
        Map<Long, List<TeamLevelProgress>> progressByTeam = allProgress.stream()
                .collect(Collectors.groupingBy(p -> p.getTeam().getId()));

        // Level breakdown
        List<LevelStatisticsDto> levelBreakdown = new ArrayList<>();
        for (int lvl = 1; lvl <= 6; lvl++) {
            final int currentLvl = lvl;
            long reached = 0;
            long completed = 0;
            long currentlyHere = 0;

            for (Team team : teams) {
                List<TeamLevelProgress> progressList = progressByTeam.getOrDefault(team.getId(), Collections.emptyList());
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
                        .antiCheatPenalties(e.getAntiCheatPenalties())
                        .competitiveScore(e.getCompetitiveScore())
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
                        .antiCheatPenalties(e.getAntiCheatPenalties())
                        .competitiveScore(e.getCompetitiveScore())
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

    private LeaderboardEntryDto buildLeaderboardEntry(Event event, Team team, Integer rank,
                                                      List<TeamLevelProgress> progressList,
                                                      List<Player> players,
                                                      TeamAntiCheatSummary summary,
                                                      Integer competitiveScore) {
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        int currentLevel = (activeProgress != null) ? activeProgress.getLevel().getLevelNumber() : (team.getGameState() == TeamGameState.COMPLETED ? 6 : 1);

        Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
        Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

        Long durationSeconds = null;
        String formattedDuration = "-";

        if (team.getGameState() == TeamGameState.COMPLETED && team.getCompletedAt() != null) {
            durationSeconds = calculateDurationSeconds(event, team);
            formattedDuration = formatDuration(durationSeconds);
        }

        int antiCheatPenalties = (summary != null) ? summary.getTotalPenaltyPoints() : 0;
        int totalViolations = (summary != null) ? summary.getTotalViolations() : 0;

        return LeaderboardEntryDto.builder()
                .rank(team.getGameState() == TeamGameState.COMPLETED ? rank : null)
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
                .antiCheatPenalties(antiCheatPenalties)
                .totalViolations(totalViolations)
                .competitiveScore(competitiveScore)
                .build();
    }

    private long calculateDurationSeconds(Event event, Team team) {
        Instant startTime = (team.getStartedAt() != null) ? team.getStartedAt()
                : ((event.getStartTime() != null) ? event.getStartTime() : team.getCreatedAt());
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
