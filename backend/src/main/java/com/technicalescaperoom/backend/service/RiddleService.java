package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.RiddleDto.*;
import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamRiddleProgress;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.WebSocketEventType;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.repository.TeamRiddleProgressRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiddleService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final TeamRiddleProgressRepository teamRiddleProgressRepository;
    private final AuditService auditService;
    private final GameWebSocketPublisher webSocketPublisher;
    private final EntityManager entityManager;

    // Server-authoritative secret answers for the 6 standalone logic riddles.
    // NEVER expose these answers, arrays, or mappings to the frontend or public APIs.
    private static final Map<Integer, String> RIDDLE_ANSWERS = Map.of(
            1, "3", // Riddle 1 (Easy): Sprinters race ordering -> Place 3
            2, "8", // Riddle 2 (Easy/Medium): Magic square 3x3 sum 15 -> Missing 8
            3, "2", // Riddle 3 (Medium): Three inhabitants truth-tellers & liars -> 2 Liars
            4, "4", // Riddle 4 (Medium/Hard): 3-digit combination lock -> Middle digit 4
            5, "5", // Riddle 5 (Hard): 8-person hat color deduction -> 5 Red hats
            6, "9"  // Riddle 6 (Hardest): SEND+MORE=MONEY cryptarithm -> Digit S = 9
    );

    @Transactional(readOnly = true)
    public RiddleBoardStateResponseDto getRiddleBoardState(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        long completedLevels = getCompletedLevelsCount(team);

        List<TeamRiddleProgress> progressList = teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(team.getId());
        Map<Integer, TeamRiddleProgress> progressMap = new HashMap<>();
        for (TeamRiddleProgress p : progressList) {
            progressMap.put(p.getRiddleIndex(), p);
        }

        List<RiddleItemStateDto> itemDtos = new ArrayList<>();
        int solvedCount = 0;
        int unlockedCount = 0;

        for (int i = 1; i <= 6; i++) {
            boolean isUnlocked = completedLevels >= i;
            TeamRiddleProgress p = progressMap.get(i);
            boolean isSolved = p != null && Boolean.TRUE.equals(p.getIsSolved());

            String status;
            String solvedDigit = null;

            if (isSolved) {
                status = "SOLVED";
                solvedDigit = p.getSolvedDigit();
                solvedCount++;
                unlockedCount++;
            } else if (isUnlocked) {
                status = "UNLOCKED";
                unlockedCount++;
            } else {
                status = "LOCKED";
            }

            itemDtos.add(RiddleItemStateDto.builder()
                    .riddleIndex(i)
                    .levelNumber(i)
                    .status(status)
                    .solvedDigit(solvedDigit)
                    .build());
        }

        return RiddleBoardStateResponseDto.builder()
                .totalRiddles(6)
                .unlockedCount(unlockedCount)
                .solvedCount(solvedCount)
                .allRiddlesSolved(solvedCount == 6)
                .riddles(itemDtos)
                .build();
    }

    @Transactional
    public RiddleSubmissionResponseDto submitRiddleAnswer(PlayerPrincipal principal, RiddleSubmissionRequest request) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        int riddleIndex = request.getRiddleIndex();
        String submittedDigit = request.getDigit().trim();

        Team team = teamRepository.findForUpdateById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));
        entityManager.refresh(team);

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found for ID " + principal.getPlayerId()));

        validateEventAndTimer(team);

        // Level Unlock Validation: Team must have completed level equal to riddleIndex
        long completedLevels = getCompletedLevelsCount(team);
        if (completedLevels < riddleIndex) {
            log.warn("Team {} (Player {}) attempted to solve locked Riddle {} with only {} completed levels.",
                    team.getTeamCode(), player.getDisplayName(), riddleIndex, completedLevels);
            return RiddleSubmissionResponseDto.builder()
                    .riddleIndex(riddleIndex)
                    .status("LOCKED")
                    .message("Riddle " + riddleIndex + " is locked. Complete Level " + riddleIndex + " first.")
                    .build();
        }

        // Fetch or create team riddle progress record
        TeamRiddleProgress progress = teamRiddleProgressRepository.findByTeamIdAndRiddleIndex(team.getId(), riddleIndex)
                .orElseGet(() -> TeamRiddleProgress.builder()
                        .team(team)
                        .riddleIndex(riddleIndex)
                        .isSolved(false)
                        .wrongAttempts(0)
                        .build());

        // Idempotency: if already solved, return success immediately
        if (Boolean.TRUE.equals(progress.getIsSolved())) {
            long totalSolved = countSolvedRiddles(team.getId());
            return RiddleSubmissionResponseDto.builder()
                    .riddleIndex(riddleIndex)
                    .status("SOLVED")
                    .message("Riddle is already solved.")
                    .solvedDigit(progress.getSolvedDigit())
                    .allRiddlesSolved(totalSolved == 6)
                    .build();
        }

        // Server-side rate limiting against brute-force attempts
        Instant now = Instant.now();
        if (progress.getLastAttemptAt() != null) {
            long secondsSinceLast = Duration.between(progress.getLastAttemptAt(), now).getSeconds();
            if (secondsSinceLast < 2) {
                return RiddleSubmissionResponseDto.builder()
                        .riddleIndex(riddleIndex)
                        .status("RATE_LIMITED")
                        .message("Submission rate limit reached. Please wait a few seconds before trying again.")
                        .build();
            }
            if (progress.getWrongAttempts() >= 5 && secondsSinceLast < 10) {
                return RiddleSubmissionResponseDto.builder()
                        .riddleIndex(riddleIndex)
                        .status("RATE_LIMITED")
                        .message("Too many attempts. Cooldown active. Try again in 10 seconds.")
                        .build();
            }
        }

        // Validate answer against authoritative backend map
        String expectedDigit = RIDDLE_ANSWERS.get(riddleIndex);
        boolean isCorrect = expectedDigit != null && expectedDigit.equals(submittedDigit);

        if (isCorrect) {
            progress.setIsSolved(true);
            progress.setSolvedDigit(expectedDigit);
            progress.setSolvedAt(now);
            progress.setSolvedByPlayer(player);
            teamRiddleProgressRepository.saveAndFlush(progress);

            long totalSolved = countSolvedRiddles(team.getId());

            log.info("Team {} (Player {}) solved Riddle {} with digit {}. Total solved: {}/6",
                    team.getTeamCode(), player.getDisplayName(), riddleIndex, expectedDigit, totalSolved);

            auditService.logEvent(
                    GameEventType.ANSWER_CORRECT,
                    team.getEvent(),
                    team,
                    player,
                    "{\"type\": \"RIDDLE_SUBMISSION\", \"riddleIndex\": " + riddleIndex + ", \"result\": \"CORRECT\"}",
                    "PLAYER"
            );

            // Broadcast WebSocket notification so teammate receives real-time update
            WebSocketEventDto wsEvent = WebSocketEventDto.builder()
                    .type(WebSocketEventType.GAME_STATE_UPDATED)
                    .teamId(team.getId())
                    .playerId(player.getId())
                    .playerNumber(player.getPlayerNumber())
                    .message("Teammate solved Riddle " + riddleIndex + " ✓")
                    .timestamp(now)
                    .build();
            webSocketPublisher.broadcastToTeam(team.getId(), wsEvent);

            return RiddleSubmissionResponseDto.builder()
                    .riddleIndex(riddleIndex)
                    .status("SOLVED")
                    .message("CORRECT. RIDDLE SOLVED.")
                    .solvedDigit(expectedDigit)
                    .allRiddlesSolved(totalSolved == 6)
                    .build();
        } else {
            progress.setWrongAttempts(progress.getWrongAttempts() + 1);
            progress.setLastAttemptAt(now);
            teamRiddleProgressRepository.saveAndFlush(progress);

            log.info("Team {} (Player {}) entered incorrect digit for Riddle {}. Attempts: {}",
                    team.getTeamCode(), player.getDisplayName(), riddleIndex, progress.getWrongAttempts());

            auditService.logEvent(
                    GameEventType.ANSWER_WRONG,
                    team.getEvent(),
                    team,
                    player,
                    "{\"type\": \"RIDDLE_SUBMISSION\", \"riddleIndex\": " + riddleIndex + ", \"result\": \"INCORRECT\"}",
                    "PLAYER"
            );

            return RiddleSubmissionResponseDto.builder()
                    .riddleIndex(riddleIndex)
                    .status("INCORRECT")
                    .message("INCORRECT. RE-EXAMINE THE CLUES CAREFULLY.")
                    .build();
        }
    }

    public boolean areAllRiddlesSolvedForTeam(Long teamId) {
        if (teamId == null) return false;
        long solvedCount = teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(teamId).stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsSolved()))
                .count();
        return solvedCount == 6;
    }

    private long countSolvedRiddles(Long teamId) {
        return teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(teamId).stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsSolved()))
                .count();
    }

    private long getCompletedLevelsCount(Team team) {
        long countFromRepo = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId()).stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED)
                .count();
        long countFromTeam = team.getCompletedLevels() != null ? team.getCompletedLevels() : 0L;
        return Math.max(countFromRepo, countFromTeam);
    }

    private void validateEventAndTimer(Team team) {
        Event event = team.getEvent();
        long totalStoryPause = team.getTotalStoryPauseSeconds() != null ? team.getTotalStoryPauseSeconds() : 0L;
        if (team.isStoryActive() && team.getStoryPausedAt() != null) {
            totalStoryPause += Math.max(0, Duration.between(team.getStoryPausedAt(), Instant.now()).getSeconds());
        }
        if (team.getStartedAt() != null) {
            Instant deadline = team.getStartedAt().plusSeconds(100 * 60L + totalStoryPause);
            if (Instant.now().isAfter(deadline)) {
                throw new EventUnavailableException("The 100-minute game window has ended. Time expired.");
            }
        } else if (event.getStartTime() != null && Instant.now().isAfter(event.getStartTime().plusSeconds(100 * 60L))) {
            throw new EventUnavailableException("The 100-minute game window has ended. Time expired.");
        }
        if (event.getStatus() == EventStatus.PAUSED) {
            throw new EventUnavailableException("The event is currently paused by the organizer.");
        }
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }
    }
}
