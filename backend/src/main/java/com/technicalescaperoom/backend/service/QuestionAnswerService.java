package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.content.LevelContentValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionAnswerService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    private final QuestionRepository questionRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final AuditService auditService;
    private final GameWebSocketPublisher webSocketPublisher;
    private final GameStateService gameStateService;
    private final LevelContentValidationService levelContentValidationService;
    private final jakarta.persistence.EntityManager entityManager;

    @Transactional(readOnly = true)
    public PlayerQuestionDto getCurrentQuestionForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        // Strict Team Isolation: Load Team strictly from session context
        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        if (!player.getTeam().getId().equals(team.getId())) {
            throw new ResourceNotFoundException("Player does not belong to the specified team.");
        }

        Event event = team.getEvent();
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        // Find active level progress for team
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for current game state."));

        Level currentLevel = activeProgress.getLevel();
        levelContentValidationService.validateLevelContent(currentLevel);

        QuestionPlayer qPlayerRole = (player.getPlayerNumber() == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;

        // Player Question Isolation: Retrieve strictly the assigned QuestionPlayer role
        Question question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), qPlayerRole)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + currentLevel.getLevelNumber() + " and Player " + player.getPlayerNumber()));

        boolean isCompleted = (player.getPlayerNumber() == 1) ? activeProgress.getPlayer1Completed() : activeProgress.getPlayer2Completed();
        long attemptCount = answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
                team.getId(), player.getId(), currentLevel.getId(), question.getId()
        );

        return PlayerQuestionDto.builder()
                .levelNumber(currentLevel.getLevelNumber())
                .questionId(question.getId())
                .puzzleContext(question.getPuzzleContext())
                .questionContent(question.getQuestionContent())
                .answerType(question.getAnswerType())
                .isCompleted(isCompleted)
                .attemptCount((int) attemptCount)
                .build();
    }

    @Transactional
    public AnswerSubmissionResponseDto submitAnswer(PlayerPrincipal principal, AnswerSubmissionRequest request) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        String submittedRaw = (request.getAnswer() != null) ? request.getAnswer().trim() : "";
        if (submittedRaw.isEmpty()) {
            throw new IllegalArgumentException("Submitted answer cannot be empty.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        if (!player.getTeam().getId().equals(team.getId())) {
            throw new ResourceNotFoundException("Player does not belong to the specified team.");
        }

        Event event = team.getEvent();
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        // Server-Authoritative Active Level Derivation
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for answer submission."));

        if (request.getLevelNumber() != null && !request.getLevelNumber().equals(activeProgress.getLevel().getLevelNumber())) {
            throw new InvalidLevelTransitionException("Submitted level number does not match current active level " + activeProgress.getLevel().getLevelNumber() + ".");
        }

        Level currentLevel = activeProgress.getLevel();
        QuestionPlayer qPlayerRole = (player.getPlayerNumber() == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;

        Question question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), qPlayerRole)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + currentLevel.getLevelNumber()));

        boolean alreadyCompleted = (player.getPlayerNumber() == 1) ? Boolean.TRUE.equals(activeProgress.getPlayer1Completed()) : Boolean.TRUE.equals(activeProgress.getPlayer2Completed());
        if (alreadyCompleted || activeProgress.getLevelStatus() == LevelStatus.COMPLETED) {
            return AnswerSubmissionResponseDto.builder()
                    .correct(true)
                    .isCompleted(true)
                    .message("Your challenge for this level is already completed.")
                    .build();
        }

        // Server-Controlled Attempt Counter
        long previousAttempts = answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
                team.getId(), player.getId(), currentLevel.getId(), question.getId()
        );
        int attemptNumber = (int) previousAttempts + 1;

        // Validation & Normalization
        boolean isCorrect = normalizeAndValidate(submittedRaw, question.getExpectedAnswerHash(), question.getAnswerType());

        // Record Answer Attempt
        AnswerAttempt attempt = AnswerAttempt.builder()
                .team(team)
                .player(player)
                .level(currentLevel)
                .question(question)
                .submittedAnswer(submittedRaw)
                .isCorrect(isCorrect)
                .attemptNumber(attemptNumber)
                .build();
        answerAttemptRepository.save(attempt);

        if (isCorrect) {
            TeamLevelProgress progressToUpdate = teamLevelProgressRepository
                    .findForUpdateByTeamIdAndLevelId(team.getId(), currentLevel.getId())
                    .orElse(activeProgress);

            entityManager.refresh(progressToUpdate);

            if (player.getPlayerNumber() == 1) {
                progressToUpdate.setPlayer1Completed(true);
            } else {
                progressToUpdate.setPlayer2Completed(true);
            }

            if (progressToUpdate.getLevelStatus() == LevelStatus.AVAILABLE) {
                progressToUpdate.setLevelStatus(LevelStatus.IN_PROGRESS);
            }

            TeamLevelProgress savedProgress = teamLevelProgressRepository.saveAndFlush(progressToUpdate);

            boolean bothCompleted = Boolean.TRUE.equals(savedProgress.getPlayer1Completed())
                    && Boolean.TRUE.equals(savedProgress.getPlayer2Completed());

            auditService.logEvent(
                    GameEventType.ANSWER_CORRECT,
                    event,
                    team,
                    player,
                    "{\"levelNumber\": " + currentLevel.getLevelNumber() + ", \"attemptNumber\": " + attemptNumber + "}",
                    "PLAYER"
            );

            log.info("Player {} (P{}) correctly solved Level {} challenge on attempt #{}", player.getId(), player.getPlayerNumber(), currentLevel.getLevelNumber(), attemptNumber);

            // Real-Time STOMP Notifications & Game State Progression
            webSocketPublisher.notifyPartnerChallengeCompleted(team.getId(), currentLevel.getLevelNumber(), player.getPlayerNumber());

            if (bothCompleted) {
                log.info("Both players completed Level {} for Team {}. Executing level progression...", currentLevel.getLevelNumber(), team.getTeamCode());
                gameStateService.completeLevel(team.getId(), currentLevel.getLevelNumber());
                webSocketPublisher.notifyLevelCompleted(team.getId(), currentLevel.getLevelNumber());
                webSocketPublisher.notifyHintUnlocked(team.getId(), currentLevel.getLevelNumber(), currentLevel.getLevelNumber());
                if (currentLevel.getLevelNumber() < 6) {
                    webSocketPublisher.notifyNextLevelUnlocked(team.getId(), currentLevel.getLevelNumber() + 1);
                }
            }

            return AnswerSubmissionResponseDto.builder()
                    .correct(true)
                    .isCompleted(true)
                    .message(bothCompleted ? "Level Completed! Both players solved their challenges." : "Correct! Your challenge is complete.")
                    .build();
        } else {
            auditService.logEvent(
                    GameEventType.ANSWER_WRONG,
                    event,
                    team,
                    player,
                    "{\"levelNumber\": " + currentLevel.getLevelNumber() + ", \"attemptNumber\": " + attemptNumber + "}",
                    "PLAYER"
            );

            return AnswerSubmissionResponseDto.builder()
                    .correct(false)
                    .isCompleted(false)
                    .message("Incorrect answer. Try again.")
                    .build();
        }
    }

    private boolean normalizeAndValidate(String submitted, String expected, AnswerType answerType) {
        if (submitted == null || expected == null) return false;

        String normSubmitted = submitted.trim();
        String normExpected = expected.trim();

        if (answerType == AnswerType.NUMERIC) {
            normSubmitted = normSubmitted.replaceAll("[\\s,]", "");
            normExpected = normExpected.replaceAll("[\\s,]", "");
            return normSubmitted.equals(normExpected);
        }

        // Standard Text, Code, SQL, Decode normalization
        return normSubmitted.equalsIgnoreCase(normExpected);
    }
}
