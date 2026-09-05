package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeyResponseDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinalPasskeyService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final AuditService auditService;
    private final GameWebSocketPublisher webSocketPublisher;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;
    private final com.technicalescaperoom.backend.service.admin.LeaderboardService leaderboardService;

    @Transactional
    public FinalPasskeyResponseDto submitFinalPasskey(PlayerPrincipal principal, FinalPasskeySubmissionRequest request) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        // Lock Team row using Pessimistic Write Lock
        Team team = teamRepository.findForUpdateById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        entityManager.refresh(team);

        Event event = team.getEvent();
        if (event.getStartTime() != null && Instant.now().isAfter(event.getStartTime().plusSeconds(90 * 60L))) {
            throw new EventUnavailableException("The 90-minute game window has ended.");
        }
        if (event.getStatus() == EventStatus.PAUSED) {
            throw new EventUnavailableException("The event is currently paused by the organizer.");
        }
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found for ID " + principal.getPlayerId()));

        // Check if team is already completed
        if (team.getGameState() == TeamGameState.COMPLETED) {
            log.info("Team {} already completed CodeXcape at {}.", team.getTeamCode(), team.getCompletedAt());
            return FinalPasskeyResponseDto.builder()
                    .status("ALREADY_COMPLETED")
                    .message("CodeXcape has already been completed by your team.")
                    .completedAt(team.getCompletedAt())
                    .build();
        }

        // Check eligibility (all 6 levels must be COMPLETED)
        long completedLevelsCount = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId()).stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.COMPLETED)
                .count();

        if (completedLevelsCount < 6 && team.getGameState() != TeamGameState.FINAL_PASSKEY) {
            log.warn("Team {} attempted final passkey submission without completing all 6 levels (completed: {}).", team.getTeamCode(), completedLevelsCount);
            return FinalPasskeyResponseDto.builder()
                    .status("FINAL_NOT_AVAILABLE")
                    .message("Final passkey terminal is not available. Complete all 6 levels first.")
                    .build();
        }

        // Validate Passkey
        String expectedHash = team.getEvent().getPasskeyHash();
        String submittedPasskey = request.getPasskey().trim();

        boolean isCorrect = false;
        if (expectedHash != null) {
            if (expectedHash.startsWith("$2a$") || expectedHash.startsWith("$2b$") || expectedHash.startsWith("$2y$")) {
                isCorrect = passwordEncoder.matches(submittedPasskey, expectedHash);
            } else {
                isCorrect = submittedPasskey.equalsIgnoreCase(expectedHash);
            }
        }

        if (!isCorrect) {
            log.info("Player {} on Team {} entered INCORRECT final passkey.", player.getDisplayName(), team.getTeamCode());
            auditService.logEvent(
                    GameEventType.ANSWER_WRONG,
                    team.getEvent(),
                    team,
                    player,
                    "{\"type\": \"FINAL_PASSKEY_SUBMISSION\", \"result\": \"INCORRECT\"}",
                    "PLAYER"
            );

            return FinalPasskeyResponseDto.builder()
                    .status("INCORRECT")
                    .message("Incorrect passkey.")
                    .build();
        }

        // Success - Complete Game for Team
        Instant now = Instant.now();
        team.setGameState(TeamGameState.COMPLETED);
        team.setCompletedAt(now);
        teamRepository.saveAndFlush(team);

        log.info("🎉 Team {} (Player {}) successfully completed CodeXcape at {}!", team.getTeamCode(), player.getDisplayName(), now);

        auditService.logEvent(
                GameEventType.ANSWER_CORRECT,
                team.getEvent(),
                team,
                player,
                "{\"type\": \"FINAL_PASSKEY_SUBMISSION\", \"result\": \"CORRECT\"}",
                "PLAYER"
        );

        webSocketPublisher.notifyGameCompleted(team.getId());
        leaderboardService.recalculateAndBroadcastRanks(team.getEvent().getId(), webSocketPublisher);

        return FinalPasskeyResponseDto.builder()
                .status("COMPLETED")
                .message("Congratulations! CodeXcape completed!")
                .completedAt(now)
                .build();
    }
}
