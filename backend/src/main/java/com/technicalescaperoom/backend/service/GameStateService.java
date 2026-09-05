package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.CurrentLevelDto;
import com.technicalescaperoom.backend.dto.player.LevelProgressDto;
import com.technicalescaperoom.backend.dto.player.PlayerGameStateDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.entity.TeamStageProgress;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.repository.QuestionRepository;
import com.technicalescaperoom.backend.repository.TeamStageProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameStateService {

    private final TeamRepository teamRepository;
    private final LevelRepository levelRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final TeamStageProgressRepository teamStageProgressRepository;
    private final QuestionRepository questionRepository;
    private final EventRepository eventRepository;
    private final com.technicalescaperoom.backend.service.admin.LeaderboardService leaderboardService;
    private final GameWebSocketPublisher webSocketPublisher;

    @Transactional
    public List<TeamLevelProgress> initializeTeamGameState(Team team) {
        List<TeamLevelProgress> existing = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        if (!existing.isEmpty()) {
            return existing;
        }

        List<Level> activeLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc().stream()
                .filter(level -> level.getLevelNumber() >= 1 && level.getLevelNumber() <= 6)
                .toList();
        if (activeLevels.isEmpty()) {
            throw new ResourceNotFoundException("No active game levels configured in the system.");
        }

        List<TeamLevelProgress> newProgressList = new ArrayList<>();
        Instant now = Instant.now();

        for (Level level : activeLevels) {
            boolean isFirstLevel = level.getLevelNumber() == 1;
            TeamLevelProgress progress = TeamLevelProgress.builder()
                    .team(team)
                    .level(level)
                    .player1Completed(false)
                    .player2Completed(false)
                    .levelStatus(isFirstLevel ? LevelStatus.AVAILABLE : LevelStatus.LOCKED)
                    .startedAt(isFirstLevel ? now : null)
                    .build();

            newProgressList.add(teamLevelProgressRepository.save(progress));

                questionRepository.findByLevelIdAndIsActiveTrue(level.getId()).stream()
                    .map(question -> question.getStageNumber())
                    .distinct()
                    .sorted()
                    .forEach(stageNumber -> teamStageProgressRepository.save(TeamStageProgress.builder()
                        .team(team)
                        .level(level)
                        .stageNumber(stageNumber)
                        .discoveryKey("L" + level.getLevelNumber() + "-S" + stageNumber)
                        .build()));
        }

        team.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(team);

        log.info("Initialized 6-level game state for team ID {} ({})", team.getId(), team.getTeamCode());
        return newProgressList;
    }

    @Transactional
    public PlayerGameStateDto getGameStateForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        // Strict Team Isolation: Load team exclusively from authenticated session
        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Event event = team.getEvent();
        Instant serverTime = Instant.now();
        Instant deadline = event.getStartTime() == null ? null : event.getStartTime().plusSeconds(90 * 60L);

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        if (progressList.isEmpty() && (event.getStatus() == EventStatus.READY || event.getStatus() == EventStatus.RUNNING)) {
            progressList = initializeTeamGameState(team);
        }

        Integer currentLevelNumber = 1;
        boolean allCompleted = true;

        if (!progressList.isEmpty()) {
            Optional<TeamLevelProgress> currentActiveOpt = progressList.stream()
                    .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                    .findFirst();

            if (currentActiveOpt.isPresent()) {
                currentLevelNumber = currentActiveOpt.get().getLevel().getLevelNumber();
                allCompleted = false;
            } else {
                long completedCount = progressList.stream()
                        .filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED)
                        .count();

                if (completedCount == progressList.size() && !progressList.isEmpty()) {
                    currentLevelNumber = progressList.size();
                    if (team.getGameState() != TeamGameState.COMPLETED) {
                        team.setGameState(TeamGameState.FINAL_PASSKEY);
                        teamRepository.save(team);
                    }
                } else {
                    allCompleted = false;
                }
            }
        }

        List<LevelProgressDto> levelDtos = progressList.stream()
                .map(p -> LevelProgressDto.builder()
                        .levelNumber(p.getLevel().getLevelNumber())
                        .name(p.getLevel().getName())
                        .status(p.getLevelStatus())
                        .build())
                .toList();

        Integer currentRank = leaderboardService.getTeamCurrentRank(team.getId());

        return PlayerGameStateDto.builder()
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .gameStatus(team.getGameState())
                .currentLevel(currentLevelNumber)
                .currentRank(currentRank)
                .eventStatus(event.getStatus())
                .levels(levelDtos)
                .serverTime(serverTime)
                .deadline(deadline)
                .build();
    }

    @Transactional(readOnly = true)
    public CurrentLevelDto getCurrentLevelForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        if (team.getEvent().getStatus() != EventStatus.RUNNING && team.getEvent().getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress currentProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for current team state."));

        Level level = currentProgress.getLevel();

        return CurrentLevelDto.builder()
                .levelNumber(level.getLevelNumber())
                .name(level.getName())
                .description(level.getDescription())
                .difficulty(level.getDifficulty())
                .build();
    }

    @Transactional
    public void completeLevel(Long teamId, Integer levelNumber) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Level level = levelRepository.findByLevelNumber(levelNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Level " + levelNumber + " not found."));

        TeamLevelProgress progress = teamLevelProgressRepository.findForUpdateByTeamIdAndLevelId(teamId, level.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Level progress not initialized for team."));

        // Prevention of Level Skipping & Invalid Transitions
        if (progress.getLevelStatus() == LevelStatus.LOCKED) {
            throw new InvalidLevelTransitionException("Cannot complete Level " + levelNumber + " because it is currently locked.");
        }

        // Idempotency: If already completed, safely return without side effects
        if (progress.getLevelStatus() == LevelStatus.COMPLETED) {
            log.info("Level {} for team {} is already completed. Skipping idempotent transition.", levelNumber, teamId);
            return;
        }

        progress.setLevelStatus(LevelStatus.COMPLETED);
        progress.setCompletedAt(Instant.now());
        teamLevelProgressRepository.save(progress);

        // Unlock next level sequentially or transition to FINAL_PASSKEY
        if (levelNumber < 6) {
            Optional<Level> nextLevelOpt = levelRepository.findByLevelNumber(levelNumber + 1);
            if (nextLevelOpt.isPresent()) {
                Level nextLevel = nextLevelOpt.get();
                Optional<TeamLevelProgress> nextProgressOpt = teamLevelProgressRepository.findByTeamIdAndLevelId(teamId, nextLevel.getId());

                if (nextProgressOpt.isPresent()) {
                    TeamLevelProgress nextProgress = nextProgressOpt.get();
                    if (nextProgress.getLevelStatus() == LevelStatus.LOCKED) {
                        nextProgress.setLevelStatus(LevelStatus.AVAILABLE);
                        nextProgress.setStartedAt(Instant.now());
                        teamLevelProgressRepository.save(nextProgress);
                    }
                }
            }
            team.setGameState(TeamGameState.IN_PROGRESS);
        } else if (levelNumber == 6) {
            log.info("Level 6 completed for team {}. Transitioning to FINAL_PASSKEY state.", teamId);
            team.setGameState(TeamGameState.FINAL_PASSKEY);
        }

        teamRepository.save(team);
        leaderboardService.recalculateAndBroadcastRanks(team.getEvent().getId(), webSocketPublisher);
    }

    @Transactional
    public void startEventGameplay(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found."));

        long configuredLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc().stream()
            .filter(level -> level.getLevelNumber() >= 1 && level.getLevelNumber() <= 6)
            .count();
        if (configuredLevels != 6) {
            throw new InvalidLevelTransitionException("Exactly 6 active game levels must be configured before gameplay can start.");
        }

        event.setStatus(EventStatus.RUNNING);
        event.setStartTime(Instant.now());
        eventRepository.save(event);

        List<Team> teams = teamRepository.findByEventId(eventId);
        for (Team team : teams) {
            initializeTeamGameState(team);
        }

        log.info("Started gameplay for event ID {}. Initialized {} teams.", eventId, teams.size());
    }

    @Transactional(readOnly = true)
    public com.technicalescaperoom.backend.dto.player.FullPlayerResyncStateDto getFullResyncStateForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        int currentLevel = (activeProgress != null) ? activeProgress.getLevel().getLevelNumber() : (team.getGameState() == TeamGameState.COMPLETED ? 6 : 1);
        boolean isCompleted = (team.getGameState() == TeamGameState.COMPLETED);

        boolean myCompleted = false;
        boolean partnerCompleted = false;

        if (activeProgress != null) {
            if (principal.getPlayerNumber() == 1) {
                myCompleted = Boolean.TRUE.equals(activeProgress.getPlayer1Completed());
                partnerCompleted = Boolean.TRUE.equals(activeProgress.getPlayer2Completed());
            } else {
                myCompleted = Boolean.TRUE.equals(activeProgress.getPlayer2Completed());
                partnerCompleted = Boolean.TRUE.equals(activeProgress.getPlayer1Completed());
            }
        }

        Integer currentRank = leaderboardService.getTeamCurrentRank(team.getId());

        return com.technicalescaperoom.backend.dto.player.FullPlayerResyncStateDto.builder()
                .teamId(team.getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .playerNumber(principal.getPlayerNumber())
                .displayName(principal.getDisplayName())
                .gameState(team.getGameState())
                .currentLevel(currentLevel)
                .currentRank(currentRank)
                .isCompleted(isCompleted)
                .completedAt(team.getCompletedAt())
                .myCompletedCurrentLevel(myCompleted)
                .partnerCompletedCurrentLevel(partnerCompleted)
                .build();
    }
}
