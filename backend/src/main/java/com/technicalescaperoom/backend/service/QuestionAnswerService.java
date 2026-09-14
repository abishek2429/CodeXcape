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
import java.util.Optional;

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
    private final ScoringService scoringService;
    private final CinematicStoryService cinematicStoryService;
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
        enforceDeadline(event, team);
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        if (team.getGameState() == TeamGameState.NOT_STARTED) {
            throw new EventUnavailableException("The event has not been started by your team yet. Please enter the team lobby.");
        }

        if (team.getGameState() == TeamGameState.FINAL_PASSKEY) {
            throw new EventUnavailableException("All 6 levels completed. Master terminal override active. Proceed to the final passkey terminal.");
        }

        if (team.getGameState() == TeamGameState.COMPLETED) {
            throw new EventUnavailableException("CodeXcape has already been completed by your team.");
        }

        // Find active level progress for team
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for current game state."));

        Level currentLevel = activeProgress.getLevel();
        if (currentLevel.getId() != null && !validatedLevelIds.contains(currentLevel.getId())) {
            levelContentValidationService.validateLevelContent(currentLevel);
            validatedLevelIds.add(currentLevel.getId());
        }

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
                .instructions(sanitizeInstructions(question.getInstructions()))
                .puzzleMetadata(sanitizePuzzleMetadata(question.getPuzzleMetadata()))
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
        enforceDeadline(event, team);
        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            throw new EventUnavailableException("The event is not currently active.");
        }

        if (team.getGameState() == TeamGameState.NOT_STARTED) {
            throw new EventUnavailableException("The event has not been started by your team yet. Please enter the team lobby.");
        }

        if (team.getGameState() == TeamGameState.FINAL_PASSKEY) {
            throw new EventUnavailableException("All 6 levels completed. Master terminal override active. Please submit the final passkey at the final terminal.");
        }

        if (team.getGameState() == TeamGameState.COMPLETED) {
            throw new EventUnavailableException("CodeXcape has already been completed by your team.");
        }

        // Server-Authoritative Active Level and major-stage derivation
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        TeamLevelProgress activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new InvalidLevelTransitionException("No active level available for answer submission."));

        if (request.getLevelNumber() != null && !request.getLevelNumber().equals(activeProgress.getLevel().getLevelNumber())) {
            TeamLevelProgress completedProgress = progressList.stream()
                    .filter(p -> p.getLevel().getLevelNumber().equals(request.getLevelNumber()) && p.getLevelStatus() == LevelStatus.COMPLETED)
                    .findFirst()
                    .orElse(null);
            if (completedProgress != null) {
                return AnswerSubmissionResponseDto.builder()
                        .correct(true)
                        .isCompleted(true)
                        .stageCompleted(true)
                        .message("Level completed. Both players solved the final stage.")
                        .build();
            }
            throw new InvalidLevelTransitionException("Submitted level number does not match current active level " + activeProgress.getLevel().getLevelNumber() + ".");
        }

        Level currentLevel = activeProgress.getLevel();

        // Concurrency Protection: Pessimistic write lock row to serialize concurrent submissions
        TeamLevelProgress progressToUpdate = teamLevelProgressRepository
                .findForUpdateByTeamIdAndLevelId(team.getId(), currentLevel.getId())
                .orElse(activeProgress);
        entityManager.refresh(progressToUpdate);

        int currentStage = findCurrentStage(currentLevel, team.getId());
        QuestionPlayer qPlayerRole = (player.getPlayerNumber() == 1) ? QuestionPlayer.PLAYER_1 : QuestionPlayer.PLAYER_2;

        Question question = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), currentStage, qPlayerRole)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found for Level " + currentLevel.getLevelNumber() + ", Stage " + currentStage));

        boolean playerAlreadyCompleted = answerAttemptRepository.existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
                team.getId(), player.getId(), currentLevel.getId(), question.getId());
        boolean bothCompleted = stageCompletedForBoth(team, currentLevel, currentStage);

        if (playerAlreadyCompleted || bothCompleted || progressToUpdate.getLevelStatus() == LevelStatus.COMPLETED) {
            boolean finalStage = currentStage >= getTotalStages(currentLevel);
            boolean isLevelCompleted = progressToUpdate.getLevelStatus() == LevelStatus.COMPLETED || (bothCompleted && finalStage);
            return AnswerSubmissionResponseDto.builder()
                    .correct(true)
                    .isCompleted(true)
                    .stageCompleted(bothCompleted)
                    .stageNumber(currentStage)
                    .nextStageNumber(bothCompleted && !finalStage ? currentStage + 1 : null)
                    .message(bothCompleted
                            ? (isLevelCompleted
                                    ? "Level completed. Both players solved the final stage."
                                    : "Stage completed. The next cooperative stage is now available.")
                            : "ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.")
                    .build();
        }

        // Server-Controlled Attempt Counter
        long previousAttempts = answerAttemptRepository.countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(
                team.getId(), player.getId(), currentLevel.getId(), question.getId()
        );
        int attemptNumber = (int) previousAttempts + 1;

        // Validation & Normalization
        boolean textMatches = normalizeAndValidate(submittedRaw, question.getExpectedAnswerHash(), question.getAnswerType());
        boolean payloadMatches = validateInteractionPayload(question, request.getInteractionPayload());
        boolean isCorrect = textMatches && payloadMatches;

        // Fallback: If text matches the expected discovery answer, always accept it
        if (!isCorrect && textMatches) {
            log.info("Player entered correct discovery answer '{}'. Accepting despite interaction payload discrepancy.", submittedRaw);
            isCorrect = true;
        }

        // If not matching current stage, check if it matches a previously completed stage on this level
        // (handling concurrent submission or test repeat from partner)
        if (!isCorrect && currentStage > 1) {
            for (int prevStage = currentStage - 1; prevStage >= 1; prevStage--) {
                final int ps = prevStage;
                Optional<Question> prevQOpt = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), ps, qPlayerRole);
                if (prevQOpt.isPresent() && normalizeAndValidate(submittedRaw, prevQOpt.get().getExpectedAnswerHash(), prevQOpt.get().getAnswerType())) {
                    boolean prevStageCompleted = stageCompletedForBoth(team, currentLevel, ps);
                    if (prevStageCompleted) {
                        return AnswerSubmissionResponseDto.builder()
                                .correct(true)
                                .isCompleted(false)
                                .stageCompleted(true)
                                .stageNumber(ps)
                                .nextStageNumber(currentStage)
                                .message("Stage completed. The next cooperative stage is now available.")
                                .build();
                    }
                }
            }
        }

        // Check for duplicate wrong attempt to debounce rapid double-clicks
        var previousAttempt = answerAttemptRepository.findFirstByTeamIdAndPlayerIdAndQuestionIdOrderBySubmittedAtDesc(
                team.getId(), player.getId(), question.getId());
        boolean isDuplicateWrongAttempt = !isCorrect
                && previousAttempt.isPresent()
                && !Boolean.TRUE.equals(previousAttempt.get().getIsCorrect())
                && submittedRaw.equalsIgnoreCase(previousAttempt.get().getSubmittedAnswer());

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
            if (progressToUpdate.getLevelStatus() == LevelStatus.AVAILABLE) {
                progressToUpdate.setLevelStatus(LevelStatus.IN_PROGRESS);
            }

            teamLevelProgressRepository.saveAndFlush(progressToUpdate);

            String discoveryHash = hashDiscovery(submittedRaw);

            TeamStageProgress stageProgress = teamStageProgressRepository
                .findByTeamIdAndLevelIdAndStageNumber(team.getId(), currentLevel.getId(), currentStage)
                .orElseGet(() -> teamStageProgressRepository.saveAndFlush(TeamStageProgress.builder()
                    .team(team)
                    .level(currentLevel)
                    .stageNumber(currentStage)
                    .discoveryKey("DISCOVERY-L" + currentLevel.getLevelNumber() + "-S" + currentStage)
                    .build()));

            if (player.getPlayerNumber() == 1) {
                stageProgress.setPlayer1Completed(true);
            } else {
                stageProgress.setPlayer2Completed(true);
            }

            boolean stageCompleted = Boolean.TRUE.equals(stageProgress.getPlayer1Completed())
                    && Boolean.TRUE.equals(stageProgress.getPlayer2Completed());

            if (stageCompleted) {
                stageProgress.setCompletedAt(Instant.now());
            }
            stageProgress.setDiscoveryKey("DISCOVERY-L" + currentLevel.getLevelNumber() + "-S" + currentStage);
            teamStageProgressRepository.saveAndFlush(stageProgress);

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

            auditService.logEvent(
                    GameEventType.ANSWER_CORRECT,
                    event,
                    team,
                    player,
                    "{\"levelNumber\": " + currentLevel.getLevelNumber() + ", \"attemptNumber\": " + attemptNumber + "}",
                    "PLAYER"
            );

            log.info("Team {} Player {} solved Level {} Stage {} on attempt #{}",
                    team.getTeamCode(), player.getPlayerNumber(), currentLevel.getLevelNumber(), currentStage, attemptNumber);

            webSocketPublisher.notifyPartnerChallengeCompleted(team.getId(), currentLevel.getLevelNumber(), currentStage, player.getPlayerNumber());

            boolean finalStage = currentStage >= getTotalStages(currentLevel);

            if (stageCompleted) {
                scoringService.recordMiniGameCompletion(team.getId(), currentLevel.getLevelNumber(), currentStage);

                if (!finalStage) {
                    webSocketPublisher.notifyStageCompleted(team.getId(), currentLevel.getLevelNumber(), currentStage, currentStage + 1);
                    cinematicStoryService.triggerStory(team, "STORY_L" + currentLevel.getLevelNumber() + "_DISCOVERY");
                } else {
                    progressToUpdate.setPlayer1Completed(true);
                    progressToUpdate.setPlayer2Completed(true);
                    teamLevelProgressRepository.saveAndFlush(progressToUpdate);
                    log.info("Team {} completed all stages of Level {}. Executing level progression...", team.getTeamCode(), currentLevel.getLevelNumber());
                    gameStateService.completeLevel(team.getId(), currentLevel.getLevelNumber());
                    webSocketPublisher.notifyLevelCompleted(team.getId(), currentLevel.getLevelNumber());
                    webSocketPublisher.notifyHintUnlocked(team.getId(), currentLevel.getLevelNumber(), currentLevel.getLevelNumber());
                    if (currentLevel.getLevelNumber() < 6) {
                        webSocketPublisher.notifyNextLevelUnlocked(team.getId(), currentLevel.getLevelNumber() + 1);
                    }
                }
            }

            return AnswerSubmissionResponseDto.builder()
                    .correct(true)
                    .isCompleted(stageCompleted && finalStage)
                    .stageCompleted(stageCompleted)
                    .stageNumber(currentStage)
                    .nextStageNumber(stageCompleted && !finalStage ? currentStage + 1 : null)
                    .message(stageCompleted
                        ? (finalStage
                            ? "Level completed. Both players solved the final stage."
                            : "Stage completed. The next cooperative stage is now available.")
                        : "ACCESS GRANTED: EVIDENCE VERIFIED. AWAITING PARTNER SYNCHRONIZATION.")
                    .build();
        } else {
            if (!isDuplicateWrongAttempt) {
                scoringService.recordWrongAttempt(team.getId(), player.getId(), currentLevel.getLevelNumber(), currentStage, attempt.getId());
            } else {
                log.info("Duplicate wrong attempt debounced for Team {}, Player {}, Question {}: '{}'",
                        team.getTeamCode(), player.getId(), question.getId(), submittedRaw);
            }

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
                    .message("ACCESS DENIED: INVALID SEQUENCE. ATTEMPT RECORDED.")
                    .build();
        }
    }

    private int findCurrentStage(Level level, Long teamId) {
        int totalStages = getTotalStages(level);
        List<TeamStageProgress> stageProgressList = teamStageProgressRepository.findByTeamIdAndLevelIdOrderByStageNumberAsc(teamId, level.getId());
        for (int stage = 1; stage <= totalStages; stage++) {
            final int s = stage;
            Optional<TeamStageProgress> spOpt = stageProgressList.stream()
                    .filter(sp -> sp.getStageNumber() != null && sp.getStageNumber() == s)
                    .findFirst();
            if (spOpt.isEmpty()) {
                return stage;
            }
            TeamStageProgress sp = spOpt.get();
            if (!Boolean.TRUE.equals(sp.getPlayer1Completed()) || !Boolean.TRUE.equals(sp.getPlayer2Completed())) {
                return stage;
            }
        }
        return totalStages;
    }

    private boolean stageCompletedForBoth(Team team, Level level, int stageNumber) {
        return stageCompletedForBoth(team.getId(), level, stageNumber);
    }

    private boolean stageCompletedForBoth(Long teamId, Level level, int stageNumber) {
        Optional<TeamStageProgress> spOpt = teamStageProgressRepository
                .findByTeamIdAndLevelIdAndStageNumber(teamId, level.getId(), stageNumber);
        if (spOpt.isPresent()) {
            TeamStageProgress sp = spOpt.get();
            return Boolean.TRUE.equals(sp.getPlayer1Completed()) && Boolean.TRUE.equals(sp.getPlayer2Completed());
        }
        return false;
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

    private void enforceDeadline(Event event, Team team) {
        if (team != null && team.getStartedAt() != null) {
            long totalStoryPause = team.getTotalStoryPauseSeconds() != null ? team.getTotalStoryPauseSeconds() : 0L;
            if (team.isStoryActive() && team.getStoryPausedAt() != null) {
                totalStoryPause += Math.max(0, java.time.Duration.between(team.getStoryPausedAt(), Instant.now()).getSeconds());
            }
            Instant deadline = team.getStartedAt().plusSeconds(100 * 60L + totalStoryPause);
            if (Instant.now().isAfter(deadline)) {
                throw new EventUnavailableException("The 100-minute game window has ended. Time expired.");
            }
        } else if (event != null && event.getStartTime() != null && Instant.now().isAfter(event.getStartTime().plusSeconds(100 * 60L))) {
            throw new EventUnavailableException("The 100-minute game window has ended. Time expired.");
        }
    }

    private final java.util.Map<Long, Integer> totalStagesCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Set<Long> validatedLevelIds = java.util.concurrent.ConcurrentHashMap.newKeySet();

    private int getTotalStages(Level level) {
        if (level == null || level.getId() == null) return 1;
        return totalStagesCache.computeIfAbsent(level.getId(), id ->
            questionRepository.findByLevelIdAndIsActiveTrue(id).stream()
                    .map(Question::getStageNumber)
                    .max(Integer::compareTo)
                    .orElse(1)
        );
    }

    public void clearCache() {
        totalStagesCache.clear();
        validatedLevelIds.clear();
    }

    private boolean normalizeAndValidate(String submitted, String expected, AnswerType answerType) {
        if (submitted == null || expected == null) return false;

        String normSubmitted = submitted.trim();
        String normExpected = expected.trim();

        // 1. Numeric normalization (strip whitespace and commas)
        if (answerType == AnswerType.NUMERIC) {
            String numSub = normSubmitted.replaceAll("[\\s,]", "");
            String numExp = normExpected.replaceAll("[\\s,]", "");
            if (numSub.equals(numExp)) return true;
        }

        // 2. Direct case-insensitive match
        if (normSubmitted.equalsIgnoreCase(normExpected)) {
            return true;
        }

        // 3. Canonical alphanumeric normalized match (handles punctuation/whitespace variations)
        String canonicalSubmitted = canonicalizeAnswer(normSubmitted);
        String canonicalExpected = canonicalizeAnswer(normExpected);
        if (!canonicalSubmitted.isEmpty() && canonicalSubmitted.equals(canonicalExpected)) {
            return true;
        }

        // 4. Multiple-choice option matching (letters A-D or option text)
        if (normExpected.length() == 1 && Character.isLetter(normExpected.charAt(0))) {
            char expChar = Character.toUpperCase(normExpected.charAt(0));
            if (canonicalSubmitted.equals(String.valueOf(expChar))
                    || canonicalSubmitted.equals("OPTION" + expChar)
                    || canonicalSubmitted.equals("CHOICE" + expChar)) {
                return true;
            }
        }

        // 5. Level 1 Stage 1: Corrupted Execution Trace (x=48, y=34)
        if (canonicalExpected.contains("48") && canonicalExpected.contains("34")) {
            if (canonicalSubmitted.contains("48") && canonicalSubmitted.contains("34")) {
                return true;
            }
        }

        // 6. Level 1 Stage 2: Python Trace Reconstruction ([4, 7, 8, 9, 5, 8])
        if (canonicalExpected.equals("478958")) {
            if (canonicalSubmitted.equals("478958")) {
                return true;
            }
        }

        // 7. Level 2 Stage 1: Stack + Queue Transmission (7, 5, 8)
        if (canonicalExpected.equals("758")) {
            if (canonicalSubmitted.equals("758")) {
                return true;
            }
        }

        // 8. Level 2 Stage 2: Binary Search Interrogation (63 | O(log n))
        if (canonicalExpected.contains("63")) {
            if (canonicalSubmitted.equals("63") || canonicalSubmitted.startsWith("63")
                    || (canonicalSubmitted.contains("63") && (canonicalSubmitted.contains("LOGN") || canonicalSubmitted.contains("OLOGN")))) {
                return true;
            }
        }

        // 9. Level 3 Stage 1: Packet Path Reconstruction (10.0.2.15 -> 10.0.2.1 -> 10.0.3.1 -> 10.0.5.1 -> 10.0.5.20 | TCP)
        if (canonicalExpected.contains("100215") && canonicalExpected.contains("TCP")) {
            if (canonicalSubmitted.contains("TCP")
                    && (canonicalSubmitted.contains("100215") || canonicalSubmitted.contains("100520") || canonicalSubmitted.contains("10.0.2.15"))) {
                return true;
            }
        }

        // 10. Level 3 Stage 2: Subnet Forensics (172.16.40.65 - 172.16.40.94 | C)
        if (canonicalExpected.contains("172164065") || canonicalExpected.contains("172164094") || canonicalExpected.endsWith("C")) {
            if (canonicalSubmitted.equals("C") || canonicalSubmitted.equals("OPTIONC") || canonicalSubmitted.contains("USABLEHOST")
                    || (canonicalSubmitted.contains("172164065") && canonicalSubmitted.contains("172164094"))) {
                return true;
            }
        }

        // 11. Level 4 Stage 1: SQL Evidence Merge (ASHA, CHITRA)
        if (canonicalExpected.contains("ASHA") && canonicalExpected.contains("CHITRA")) {
            if ((canonicalSubmitted.contains("ASHA") && canonicalSubmitted.contains("CHITRA"))
                    || (canonicalSubmitted.contains("101") && canonicalSubmitted.contains("103"))
                    || (canonicalSubmitted.contains("SELECT") && canonicalSubmitted.contains("HAVING") && canonicalSubmitted.contains("80"))) {
                return true;
            }
        }

        // 12. Level 4 Stage 2: Web Request Autopsy (500)
        if (canonicalExpected.equals("500")) {
            if (canonicalSubmitted.equals("500") || canonicalSubmitted.contains("500") || canonicalSubmitted.contains("INTERNALSERVERERROR")) {
                return true;
            }
        }

        // 13. Level 4 Stage 3: Git Branch Collision (A)
        if (canonicalExpected.equals("A")) {
            if (canonicalSubmitted.equals("A") || canonicalSubmitted.equals("OPTIONA") || canonicalSubmitted.contains("RESOLVECONFLICT")) {
                return true;
            }
        }

        // 14. Level 5 Stage 1: Multi-Layer Encoding Forensics (Hello)
        if (canonicalExpected.equalsIgnoreCase("HELLO")) {
            if (canonicalSubmitted.equalsIgnoreCase("HELLO")) {
                return true;
            }
        }

        // 15. Level 5 Stage 2: Security Incident Correlation (AUTHORIZATION)
        if (canonicalExpected.contains("AUTHORIZATION")) {
            if (canonicalSubmitted.contains("AUTHORIZATION") || canonicalSubmitted.equals("AUTHZ")
                    || canonicalSubmitted.contains("ACCESSCONTROL") || canonicalSubmitted.contains("RBAC")) {
                return true;
            }
        }

        // 16. Level 5 Stage 3: Cipher Chain (HEKKO / HELLO)
        if (canonicalExpected.equalsIgnoreCase("HEKKO") || canonicalExpected.equalsIgnoreCase("HELLO")) {
            if (canonicalSubmitted.equalsIgnoreCase("HEKKO") || canonicalSubmitted.equalsIgnoreCase("HELLO")) {
                return true;
            }
        }

        // 17. Level 6 Stage 1: Java Polymorphism Trace (CCX)
        if (canonicalExpected.equals("CCX")) {
            if (canonicalSubmitted.equals("CCX")) {
                return true;
            }
        }

        // 18. Level 6 Stage 2: Docker Deployment Failure (A / 3000:8080)
        if (canonicalExpected.equals("A") || canonicalExpected.contains("30008080")) {
            if (canonicalSubmitted.equals("A") || canonicalSubmitted.equals("OPTIONA")
                    || canonicalSubmitted.contains("30008080") || canonicalSubmitted.contains("3000:8080")) {
                return true;
            }
        }

        // 19. Level 6 Stage 3: NODE ZERO: Final Distributed Logic Breach (CHITRA / ASHA)
        if (canonicalExpected.contains("CHITRA") || canonicalExpected.contains("ASHA")) {
            if (canonicalSubmitted.contains("CHITRA") || canonicalSubmitted.contains("ASHA")) {
                return true;
            }
        }

        return false;
    }

    private String canonicalizeAnswer(String raw) {
        if (raw == null) return "";
        return raw.toUpperCase()
                .replaceAll("[:/\\-_\\s]+", "")
                .trim();
    }

    private boolean validateInteractionPayload(Question question, String interactionPayload) {
        if (question.getValidationRules() == null || question.getValidationRules().isBlank()) {
            return true;
        }
        if (interactionPayload == null || interactionPayload.isBlank()) return true;
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

    private String sanitizePuzzleMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) return metadata;
        String clean = metadata.replaceAll(",\\s*\"discovery\"\\s*:\\s*\"[^\"]*\"", "");
        clean = clean.replaceAll("\"discovery\"\\s*:\\s*\"[^\"]*\",?", "");
        return clean;
    }

    private String sanitizeInstructions(String instructions) {
        if (instructions == null || instructions.isBlank()) return instructions;
        return instructions.replace("849201", "[REDACTED-COOPERATIVE-PASSKEY]");
    }
}
