package com.technicalescaperoom.backend.game;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.AdminEventControlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class Pass4GameEngineOptimizationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Autowired
    private TeamStageProgressRepository teamStageProgressRepository;

    @Autowired
    private AnswerAttemptRepository answerAttemptRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private HintService hintService;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private PlayerSessionService playerSessionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event event;
    private Team team;
    private Player player1;
    private Player player2;
    private PlayerPrincipal p1Principal;
    private PlayerPrincipal p2Principal;

    private final String rawPasskey = "849201";

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("admin_lead", UserRole.ADMIN);

        event = eventRepository.save(Event.builder()
                .name("Pass4 Game Engine Event " + System.currentTimeMillis())
                .description("Production Engine Reliability Test")
                .status(EventStatus.DRAFT)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .createdAt(Instant.now())
                .build());

        String suffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 10000);
        team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("ENGINE-TEAM-" + suffix)
                .teamName("Engine Reliability Team")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .createdAt(Instant.now())
                .build());

        player1 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Operator 01")
                .status(PlayerStatus.CONNECTED)
                .isReady(false)
                .build());

        player2 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Operator 02")
                .status(PlayerStatus.CONNECTED)
                .isReady(false)
                .build());

        p1Principal = PlayerPrincipal.builder()
                .playerId(player1.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(1)
                .displayName(player1.getDisplayName())
                .sessionToken("token_engine_p1_" + suffix)
                .build();

        p2Principal = PlayerPrincipal.builder()
                .playerId(player2.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(2)
                .displayName(player2.getDisplayName())
                .sessionToken("token_engine_p2_" + suffix)
                .build();

        gameSessionRepository.save(GameSession.builder()
                .team(team)
                .player(player1)
                .sessionToken(p1Principal.getSessionToken())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now())
                .lastActivityAt(Instant.now())
                .build());

        gameSessionRepository.save(GameSession.builder()
                .team(team)
                .player(player2)
                .sessionToken(p2Principal.getSessionToken())
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now())
                .lastActivityAt(Instant.now())
                .build());
    }

    // =========================================================================
    // 1. EVENT STATE MACHINE TESTS
    // =========================================================================

    @Test
    @DisplayName("Event Lifecycle: Valid transitions DRAFT -> READY -> RUNNING -> PAUSED -> RUNNING -> COMPLETED")
    void testValidEventLifecycleTransitions() {
        // DRAFT -> READY
        EventResponse r1 = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.READY);
        assertThat(r1.getStatus()).isEqualTo(EventStatus.READY);

        // READY -> RUNNING
        EventResponse r2 = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING);
        assertThat(r2.getStatus()).isEqualTo(EventStatus.RUNNING);
        assertThat(r2.getStartTime()).isNotNull();
        Instant initialStartTime = r2.getStartTime();

        // Idempotent RUNNING -> RUNNING preserves original start time
        EventResponse r2Idempotent = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING);
        assertThat(r2Idempotent.getStatus()).isEqualTo(EventStatus.RUNNING);
        assertThat(r2Idempotent.getStartTime()).isEqualTo(initialStartTime);

        // RUNNING -> PAUSED
        EventResponse r3 = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.PAUSED);
        assertThat(r3.getStatus()).isEqualTo(EventStatus.PAUSED);

        // PAUSED -> RUNNING (resume)
        EventResponse r4 = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING);
        assertThat(r4.getStatus()).isEqualTo(EventStatus.RUNNING);
        assertThat(r4.getStartTime()).isEqualTo(initialStartTime);

        // RUNNING -> COMPLETED
        EventResponse r5 = adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.COMPLETED);
        assertThat(r5.getStatus()).isEqualTo(EventStatus.COMPLETED);
        assertThat(r5.getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("Event State Machine: Invalid transitions are rejected with IllegalStateException")
    void testInvalidEventLifecycleTransitions() {
        // DRAFT -> COMPLETED is illegal (must run first)
        assertThrows(IllegalStateException.class, () ->
                adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.COMPLETED));

        // Move to RUNNING
        adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING);

        // RUNNING -> DRAFT is illegal
        assertThrows(IllegalStateException.class, () ->
                adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.DRAFT));

        // RUNNING -> COMPLETED
        adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.COMPLETED);

        // COMPLETED is terminal: COMPLETED -> RUNNING must fail
        assertThrows(IllegalStateException.class, () ->
                adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.RUNNING));

        // COMPLETED -> PAUSED must fail
        assertThrows(IllegalStateException.class, () ->
                adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.PAUSED));

        // COMPLETED -> DRAFT must fail
        assertThrows(IllegalStateException.class, () ->
                adminEventControlService.updateEventStatus(adminPrincipal, event.getId(), EventStatus.DRAFT));
    }

    @Test
    @DisplayName("GameStateService.startEventGameplay: Start is idempotent and rejects terminal events")
    void testStartEventGameplayIdempotency() {
        gameStateService.startEventGameplay(event.getId());

        Event runningEvent = eventRepository.findById(event.getId()).orElseThrow();
        assertThat(runningEvent.getStatus()).isEqualTo(EventStatus.RUNNING);
        Instant firstStart = runningEvent.getStartTime();
        assertThat(firstStart).isNotNull();

        // Duplicate start preserves original startTime
        gameStateService.startEventGameplay(event.getId());
        Event duplicateEvent = eventRepository.findById(event.getId()).orElseThrow();
        assertThat(duplicateEvent.getStartTime()).isEqualTo(firstStart);

        // Terminate event
        duplicateEvent.setStatus(EventStatus.COMPLETED);
        eventRepository.saveAndFlush(duplicateEvent);

        // Re-starting a completed event must be rejected
        assertThrows(IllegalStateException.class, () ->
                gameStateService.startEventGameplay(event.getId()));
    }

    // =========================================================================
    // 2. TEAM START & COOPERATIVE READINESS
    // =========================================================================

    @Test
    @DisplayName("Team Start: Requires both operators to confirm readiness; duplicate start is idempotent")
    void testTeamStartReadinessAndIdempotency() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);

        // P1 confirms ready
        playerSessionService.setPlayerReady(p1Principal, true);

        // P1 tries to start before P2 is ready -> Fails
        assertThrows(IllegalStateException.class, () ->
                playerSessionService.startTeamEvent(p1Principal));

        // P2 confirms ready
        playerSessionService.setPlayerReady(p2Principal, true);

        // Now start event -> Success!
        PlayerResponseDto startResponse = playerSessionService.startTeamEvent(p1Principal);
        assertThat(startResponse.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS.name());

        Team startedTeam = teamRepository.findById(team.getId()).orElseThrow();
        assertThat(startedTeam.getStartedAt()).isNotNull();
        Instant originalStartedAt = startedTeam.getStartedAt();

        // P2 immediately calls start (duplicate/concurrent start) -> Returns idempotently without altering start time
        PlayerResponseDto p2StartResponse = playerSessionService.startTeamEvent(p2Principal);
        assertThat(p2StartResponse.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS.name());

        Team reloadedTeam = teamRepository.findById(team.getId()).orElseThrow();
        assertThat(reloadedTeam.getStartedAt()).isEqualTo(originalStartedAt);
    }

    // =========================================================================
    // 3. STAGE PROGRESSION & COOPERATIVE CONDITIONS
    // =========================================================================

    @Test
    @DisplayName("Stage Progression: P1 answer verifies evidence; team only advances after P2 also solves")
    void testCooperativeStageProgressionAndDuplicateSubmissions() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);
        playerSessionService.setPlayerReady(p1Principal, true);
        playerSessionService.setPlayerReady(p2Principal, true);
        playerSessionService.startTeamEvent(p1Principal);

        // Level 1 Stage 1
        PlayerQuestionDto p1Question = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
        PlayerQuestionDto p2Question = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);

        assertThat(p1Question.getStageNumber()).isEqualTo(1);
        assertThat(p2Question.getStageNumber()).isEqualTo(1);
        assertThat(p1Question.getIsCompleted()).isFalse();
        assertThat(p2Question.getIsCompleted()).isFalse();

        // Separate evidence check: P1 and P2 have different evidence
        assertThat(p1Question.getEvidence()).isNotEqualTo(p2Question.getEvidence());

        // P1 submits correct answer: "SYSTEM TRACE: K-17"
        AnswerSubmissionResponseDto p1Sub = questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer("SYSTEM TRACE: K-17")
                .build());

        assertThat(p1Sub.getCorrect()).isTrue();
        assertThat(p1Sub.getStageCompleted()).isFalse(); // Partner has not solved yet!
        assertThat(p1Sub.getIsCompleted()).isFalse(); // Level not completed yet!

        // Duplicate submission by P1: Idempotent return, does not claim stage or level is completed prematurely
        AnswerSubmissionResponseDto p1SubDuplicate = questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer("SYSTEM TRACE: K-17")
                .build());
        assertThat(p1SubDuplicate.getCorrect()).isTrue();
        assertThat(p1SubDuplicate.getStageCompleted()).isFalse();
        assertThat(p1SubDuplicate.getIsCompleted()).isTrue();

        // P1 queries question again -> marked completed for P1
        PlayerQuestionDto p1QuestionRefreshed = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
        assertThat(p1QuestionRefreshed.getIsCompleted()).isTrue();

        // P2 queries question -> still on Stage 1, not completed for P2
        PlayerQuestionDto p2QuestionBefore = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);
        assertThat(p2QuestionBefore.getStageNumber()).isEqualTo(1);
        assertThat(p2QuestionBefore.getIsCompleted()).isFalse();

        // P2 now submits correct answer for Stage 1
        AnswerSubmissionResponseDto p2Sub = questionAnswerService.submitAnswer(p2Principal, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer("SYSTEM TRACE: K-17")
                .build());

        assertThat(p2Sub.getCorrect()).isTrue();
        assertThat(p2Sub.getStageCompleted()).isTrue(); // Both have completed Stage 1!
        assertThat(p2Sub.getNextStageNumber()).isEqualTo(2);

        // Both players now receive Stage 2!
        PlayerQuestionDto p1Stage2 = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
        PlayerQuestionDto p2Stage2 = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);
        assertThat(p1Stage2.getStageNumber()).isEqualTo(2);
        assertThat(p2Stage2.getStageNumber()).isEqualTo(2);
    }

    // =========================================================================
    // 4. LEVEL PROGRESSION & SKIPPING PREVENTION
    // =========================================================================

    @Test
    @DisplayName("Level Bounds: Attempting to submit for wrong or future level is strictly rejected")
    void testLevelSkippingAndBoundaries() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);
        playerSessionService.setPlayerReady(p1Principal, true);
        playerSessionService.setPlayerReady(p2Principal, true);
        playerSessionService.startTeamEvent(p1Principal);

        // Team is at Level 1. Attempting to submit Level 2 or Level 6 answer is rejected.
        assertThrows(InvalidLevelTransitionException.class, () ->
                questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder()
                        .levelNumber(2)
                        .answer("RECOVERY FRAGMENT 02")
                        .build()));

        assertThrows(InvalidLevelTransitionException.class, () ->
                questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder()
                        .levelNumber(6)
                        .answer("CORE ACCESS GRANTED")
                        .build()));
    }

    // =========================================================================
    // 5. HINT PROGRESSION & WEBSOCKET BROADCAST
    // =========================================================================

    @Test
    @DisplayName("Hint System: Enforces progressive disclosure and sequential usage")
    void testHintProgressiveDisclosure() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);
        playerSessionService.setPlayerReady(p1Principal, true);
        playerSessionService.setPlayerReady(p2Principal, true);
        playerSessionService.startTeamEvent(p1Principal);

        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        hintRepository.save(Hint.builder()
                .level(level1)
                .stageNumber(1)
                .displayOrder(1)
                .hintContent("Level 1 Progressive Hint 1")
                .isActive(true)
                .build());

        // Level 1 Stage 1: Requesting Hint 2 before Hint 1 must be rejected
        assertThrows(ResourceNotFoundException.class, () ->
                hintService.useHint(p1Principal, 1, 1, 2));

        // Requesting Hint 1 succeeds
        HintUseResponseDto hint1 = hintService.useHint(p1Principal, 1, 1, 1);
        assertThat(hint1.getHintNumber()).isEqualTo(1);
        assertThat(hint1.getHintContent()).isEqualTo("Level 1 Progressive Hint 1");
        assertThat(hint1.isAlreadyUsed()).isFalse();

        // Duplicate request for Hint 1 returns safely as alreadyUsed
        HintUseResponseDto hint1Dup = hintService.useHint(p1Principal, 1, 1, 1);
        assertThat(hint1Dup.isAlreadyUsed()).isTrue();
    }

    // =========================================================================
    // 6. FINAL PROTOCOL & ATOMIC COMPLETION
    // =========================================================================

    @Test
    @DisplayName("Final Passkey: Unavailable until all 6 levels completed; atomic completion with idempotent repeat")
    void testFinalPasskeySubmission() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);
        playerSessionService.setPlayerReady(p1Principal, true);
        playerSessionService.setPlayerReady(p2Principal, true);
        playerSessionService.startTeamEvent(p1Principal);

        // 1. Attempt final passkey prematurely while at Level 1 -> FINAL_NOT_AVAILABLE
        FinalPasskeyResponseDto premature = finalPasskeyService.submitFinalPasskey(p1Principal, FinalPasskeySubmissionRequest.builder()
                .passkey(rawPasskey)
                .build());
        assertThat(premature.getStatus()).isEqualTo("FINAL_NOT_AVAILABLE");

        // 2. Mark all 6 levels completed to simulate reaching final terminal
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        for (TeamLevelProgress p : progressList) {
            p.setLevelStatus(LevelStatus.COMPLETED);
            p.setPlayer1Completed(true);
            p.setPlayer2Completed(true);
            p.setCompletedAt(Instant.now());
            teamLevelProgressRepository.save(p);
        }
        team.setGameState(TeamGameState.FINAL_PASSKEY);
        teamRepository.saveAndFlush(team);

        // 3. Incorrect passkey -> INCORRECT
        FinalPasskeyResponseDto wrong = finalPasskeyService.submitFinalPasskey(p1Principal, FinalPasskeySubmissionRequest.builder()
                .passkey("000000")
                .build());
        assertThat(wrong.getStatus()).isEqualTo("INCORRECT");

        // 4. Correct passkey -> COMPLETED
        FinalPasskeyResponseDto correct = finalPasskeyService.submitFinalPasskey(p1Principal, FinalPasskeySubmissionRequest.builder()
                .passkey(rawPasskey)
                .build());
        assertThat(correct.getStatus()).isEqualTo("COMPLETED");
        assertThat(correct.getCompletedAt()).isNotNull();
        Instant completedAt = correct.getCompletedAt();

        // 5. Duplicate submission -> ALREADY_COMPLETED with preserved completedAt
        FinalPasskeyResponseDto duplicate = finalPasskeyService.submitFinalPasskey(p2Principal, FinalPasskeySubmissionRequest.builder()
                .passkey(rawPasskey)
                .build());
        assertThat(duplicate.getStatus()).isEqualTo("ALREADY_COMPLETED");
        assertThat(duplicate.getCompletedAt().toEpochMilli()).isEqualTo(completedAt.toEpochMilli());

        // 6. After completion, questions and submissions are cleanly locked out
        assertThrows(EventUnavailableException.class, () ->
                questionAnswerService.getCurrentQuestionForPlayer(p1Principal));

        assertThrows(EventUnavailableException.class, () ->
                questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder()
                        .levelNumber(6)
                        .answer("TEST")
                        .build()));
    }

    // =========================================================================
    // 7. RECONNECT & RESYNC STATE RESTORATION
    // =========================================================================

    @Test
    @DisplayName("Reconnect Synchronization: Full state resync restores exact authoritative game state")
    void testReconnectSynchronization() {
        event.setStatus(EventStatus.RUNNING);
        eventRepository.saveAndFlush(event);
        playerSessionService.setPlayerReady(p1Principal, true);
        playerSessionService.setPlayerReady(p2Principal, true);
        playerSessionService.startTeamEvent(p1Principal);

        // Resync returns active level 1 and IN_PROGRESS state
        FullPlayerResyncStateDto resyncState = gameStateService.getFullResyncStateForPlayer(p1Principal);
        assertThat(resyncState.getCurrentLevel()).isEqualTo(1);
        assertThat(resyncState.getGameState()).isEqualTo(TeamGameState.IN_PROGRESS);
        assertThat(resyncState.getPlayerNumber()).isEqualTo(1);
        assertThat(resyncState.getIsCompleted()).isFalse();
    }
}
