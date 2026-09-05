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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
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
    private final DiscoverySubmissionRepository discoverySubmissionRepository;
    private final TeamStageProgressRepository teamStageProgressRepository;
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
        enforceDeadline(event);
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

        int currentStage = findCurrentStage(currentLevel, team.getId());
        QuestionPlayer qPlayerRole = (player.getPlayerNumber() == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;

        // Player Question Isolation: Retrieve strictly the assigned QuestionPlayer role
        Question question = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), currentStage, qPlayerRole)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + currentLevel.getLevelNumber() + ", Stage " + currentStage + " and Player " + player.getPlayerNumber()));

        boolean isCompleted = answerAttemptRepository
            .existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
                team.getId(), player.getId(), currentLevel.getId(), question.getId());
        long attemptCount = answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
                team.getId(), player.getId(), currentLevel.getId(), question.getId()
        );

        return PlayerQuestionDto.builder()
                .levelNumber(currentLevel.getLevelNumber())
            .stageNumber(currentStage)
            .totalStages(getTotalStages(currentLevel))
                .questionId(question.getId())
                .puzzleContext(question.getPuzzleContext())
                .evidence(question.getEvidence())
                .instructions(question.getInstructions())
                .puzzleMetadata(question.getPuzzleMetadata())
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
        enforceDeadline(event);
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        // Server-Authoritative Active Level and major-stage derivation
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for answer submission."));

        if (request.getLevelNumber() != null && !request.getLevelNumber().equals(activeProgress.getLevel().getLevelNumber())) {
            throw new InvalidLevelTransitionException("Submitted level number does not match current active level " + activeProgress.getLevel().getLevelNumber() + ".");
        }

        Level currentLevel = activeProgress.getLevel();
        int currentStage = findCurrentStage(currentLevel, team.getId());
        QuestionPlayer qPlayerRole = (player.getPlayerNumber() == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;

        Question question = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), currentStage, qPlayerRole)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + currentLevel.getLevelNumber() + ", Stage " + currentStage));

        boolean alreadyCompleted = answerAttemptRepository
            .existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
                team.getId(), player.getId(), currentLevel.getId(), question.getId());
        if (alreadyCompleted || activeProgress.getLevelStatus() == LevelStatus.COMPLETED) {
            return AnswerSubmissionResponseDto.builder()
                    .correct(true)
                    .isCompleted(true)
                    .stageCompleted(true)
                    .stageNumber(currentStage)
                    .message("Your challenge for this level is already completed.")
                    .build();
        }

        // Server-Controlled Attempt Counter
        long previousAttempts = answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
                team.getId(), player.getId(), currentLevel.getId(), question.getId()
        );
        int attemptNumber = (int) previousAttempts + 1;

        // Validation & Normalization
        boolean isCorrect = validateInteractionPayload(question, request.getInteractionPayload())
            && normalizeAndValidate(submittedRaw, question.getExpectedAnswerHash(), question.getAnswerType());

        // Record Answer Attempt
        AnswerAttempt attempt = AnswerAttempt.builder()
                .team(team)
                .player(player)
                .level(currentLevel)
                .question(question)
                .submittedAnswer(submittedRaw)
                .interactionPayload(request.getInteractionPayload())
                .isCorrect(isCorrect)
                .attemptNumber(attemptNumber)
                .build();
        answerAttemptRepository.save(attempt);

        if (isCorrect) {
            TeamLevelProgress progressToUpdate = teamLevelProgressRepository
                    .findForUpdateByTeamIdAndLevelId(team.getId(), currentLevel.getId())
                    .orElse(activeProgress);

            entityManager.refresh(progressToUpdate);

            if (progressToUpdate.getLevelStatus() == LevelStatus.AVAILABLE) {
                progressToUpdate.setLevelStatus(LevelStatus.IN_PROGRESS);
            }

            teamLevelProgressRepository.saveAndFlush(progressToUpdate);

                String discoveryHash = hashDiscovery(submittedRaw);
                DiscoverySubmission discoverySubmission = discoverySubmissionRepository
                    .findByTeamIdAndLevelIdAndStageNumberAndPlayerId(team.getId(), currentLevel.getId(), currentStage, player.getId())
                    .orElseGet(() -> DiscoverySubmission.builder()
                        .team(team)
                        .level(currentLevel)
                        .player(player)
                        .stageNumber(currentStage)
                        .build());
                discoverySubmission.setDiscoveryValueHash(discoveryHash);
                discoverySubmission.setIsCorrect(true);
                discoverySubmissionRepository.saveAndFlush(discoverySubmission);

                    TeamStageProgress stageProgress = teamStageProgressRepository
                        .findByTeamIdAndLevelIdAndStageNumber(team.getId(), currentLevel.getId(), currentStage)
                        .orElseThrow(() -> new InvalidLevelTransitionException("Stage state is not initialized."));
                    if (player.getPlayerNumber() == 1) stageProgress.setPlayer1Completed(true);
                    else stageProgress.setPlayer2Completed(true);
                    teamStageProgressRepository.saveAndFlush(stageProgress);

            boolean bothCompleted = stageCompletedForBoth(team, currentLevel, currentStage);

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
            webSocketPublisher.notifyPartnerChallengeCompleted(team.getId(), currentLevel.getLevelNumber(), currentStage, player.getPlayerNumber());

            boolean finalStage = currentStage >= getTotalStages(currentLevel);
            if (bothCompleted) {
                stageProgress.setCompletedAt(Instant.now());
                stageProgress.setDiscoveryKey("DISCOVERY-L" + currentLevel.getLevelNumber() + "-S" + currentStage);
                teamStageProgressRepository.saveAndFlush(stageProgress);
            }
            if (getTotalStages(currentLevel) == 1) {
                if (player.getPlayerNumber() == 1) {
                    progressToUpdate.setPlayer1Completed(true);
                } else {
                    progressToUpdate.setPlayer2Completed(true);
                }
                teamLevelProgressRepository.saveAndFlush(progressToUpdate);
            }
            if (bothCompleted && finalStage) {
                progressToUpdate.setPlayer1Completed(true);
                progressToUpdate.setPlayer2Completed(true);
                teamLevelProgressRepository.saveAndFlush(progressToUpdate);
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
                    .isCompleted(finalStage && bothCompleted)
                    .stageCompleted(bothCompleted)
                    .stageNumber(currentStage)
                    .nextStageNumber(bothCompleted && !finalStage ? currentStage + 1 : null)
                    .message(finalStage && bothCompleted
                        ? "Level completed. Both players solved the final stage."
                        : bothCompleted
                        ? "Stage completed. The next cooperative stage is now available."
                        : "Correct. Your evidence is verified; compare findings with your teammate.")
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
                    .stageCompleted(false)
                    .stageNumber(currentStage)
                    .message("Incorrect answer. Try again.")
                    .build();
        }
    }

    private int findCurrentStage(Level level, Long teamId) {
        List<Question> stages = questionRepository.findByLevelIdAndIsActiveTrue(level.getId()).stream()
                .filter(question -> !stageCompletedForBoth(teamId, level, question.getStageNumber()))
                .toList();
        return stages.stream()
                .map(Question::getStageNumber)
                .min(Integer::compareTo)
                .orElse(1);
    }

    private boolean stageCompletedForBoth(Team team, Level level, int stageNumber) {
        return stageCompletedForBoth(team.getId(), level, stageNumber);
    }

    private boolean stageCompletedForBoth(Long teamId, Level level, int stageNumber) {
        List<Question> questions = questionRepository.findByLevelIdAndStageNumberAndIsActiveTrue(level.getId(), stageNumber);
        if (questions.size() < 2) return false;

        boolean playersCorrect = questions.stream().allMatch(question -> {
            Long playerId = question.getPlayerNumber() == QuestionPlayer.PLAYER_1
                    ? findPlayerId(teamId, 1)
                    : findPlayerId(teamId, 2);
            return playerId != null && answerAttemptRepository
                    .existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
                            teamId, playerId, level.getId(), question.getId());
        });
                if (!playersCorrect) return false;

                List<DiscoverySubmission> submissions = questions.stream()
                    .map(question -> findPlayerId(teamId, question.getPlayerNumber() == QuestionPlayer.PLAYER_1 ? 1 : 2))
                    .map(playerId -> playerId == null ? null : discoverySubmissionRepository
                        .findByTeamIdAndLevelIdAndStageNumberAndPlayerId(teamId, level.getId(), stageNumber, playerId)
                        .orElse(null))
                    .toList();
                return submissions.size() == 2
                    && submissions.stream().allMatch(java.util.Objects::nonNull)
                    && submissions.get(0).getDiscoveryValueHash().equals(submissions.get(1).getDiscoveryValueHash());
    }

                private String hashDiscovery(String value) {
                try {
                    byte[] digest = MessageDigest.getInstance("SHA-256")
                        .digest(value.trim().toUpperCase().getBytes(StandardCharsets.UTF_8));
                    StringBuilder result = new StringBuilder();
                    for (byte item : digest) result.append(String.format("%02x", item));
                    return result.toString();
                } catch (NoSuchAlgorithmException exception) {
                    throw new IllegalStateException("Discovery hashing is unavailable.", exception);
                }
                }

    private Long findPlayerId(Long teamId, int playerNumber) {
        return playerRepository.findByTeamIdAndPlayerNumber(teamId, playerNumber)
                .map(Player::getId)
                .orElse(null);
    }

    private void enforceDeadline(Event event) {
        if (event.getStartTime() != null && Instant.now().isAfter(event.getStartTime().plusSeconds(90 * 60L))) {
            throw new EventUnavailableException("The 90-minute game window has ended.");
        }
    }

    private int getTotalStages(Level level) {
        return questionRepository.findByLevelIdAndIsActiveTrue(level.getId()).stream()
                .map(Question::getStageNumber)
                .max(Integer::compareTo)
                .orElse(1);
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

    private boolean validateInteractionPayload(Question question, String interactionPayload) {
        if (question.getValidationRules() == null || question.getValidationRules().isBlank()) {
            return true;
        }
        if (interactionPayload == null || interactionPayload.isBlank()) return false;
        java.util.regex.Matcher mode = java.util.regex.Pattern.compile("(?:MODE|OPERATION)=([^;]+)")
            .matcher(question.getValidationRules());
        if (mode.find()) {
            String required = mode.group(1);
            String field = question.getValidationRules().contains("OPERATION=") ? "operation" : "interaction";
            java.util.regex.Matcher submitted = java.util.regex.Pattern
                .compile("\\\"" + field + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"")
                .matcher(interactionPayload);
            if (!submitted.find() || !required.equals(submitted.group(1))) return false;
        }

        java.util.regex.Matcher order = java.util.regex.Pattern.compile("ORDER=([^;]+)")
            .matcher(question.getValidationRules());
        if (order.find()) {
            java.util.regex.Matcher submittedOrder = java.util.regex.Pattern
                .compile("\\\"order\\\"\\s*:\\s*\\[([^]]*)\\]")
                .matcher(interactionPayload);
            if (!submittedOrder.find()) return false;
            String normalized = submittedOrder.group(1).replaceAll("\\\"", "").replaceAll("\\s", "");
            return order.group(1).equals(normalized.replace(',', '|'));
        }
        return true;
    }
}
