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

    @Transactional(readOnly = true)
    public AdminDashboardResponseDto getDashboardStats(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        List<Team> teams = teamRepository.findByEventId(eventId);
        long totalTeams = teams.size();
        long completedTeams = teams.stream().filter(t -> t.getGameState() == TeamGameState.COMPLETED).count();
        long activeTeams = totalTeams - completedTeams;

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 6; i++) {
            distribution.put(i, 0L);
        }

        for (Team team : teams) {
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

        return AdminDashboardResponseDto.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .eventStatus(event.getStatus())
                .totalTeams(totalTeams)
                .activeTeams(activeTeams)
                .completedTeams(completedTeams)
                .levelDistribution(distribution)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminTeamProgressDto> getTeamsProgress(Long eventId, String search, Integer levelFilter) {
        List<Team> teams = teamRepository.findByEventId(eventId);
        List<AdminTeamProgressDto> dtos = new ArrayList<>();

        for (Team team : teams) {
            if (search != null && !search.isBlank()) {
                String term = search.toLowerCase().trim();
                boolean matches = team.getTeamName().toLowerCase().contains(term) || team.getTeamCode().toLowerCase().contains(term);
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

            long hintsUnlocked = progressList.stream().filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED).count();

            List<Player> players = playerRepository.findByTeamId(team.getId());
            Player p1 = players.stream().filter(p -> p.getPlayerNumber() == 1).findFirst().orElse(null);
            Player p2 = players.stream().filter(p -> p.getPlayerNumber() == 2).findFirst().orElse(null);

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
                    .hintsUnlocked((int) hintsUnlocked)
                    .completedAt(team.getCompletedAt())
                    .build();

            dtos.add(dto);
        }

        return dtos;
    }
}
