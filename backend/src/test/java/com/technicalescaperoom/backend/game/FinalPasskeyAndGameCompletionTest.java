package com.technicalescaperoom.backend.game;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeyResponseDto;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.FinalPasskeyService;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class FinalPasskeyAndGameCompletionTest {

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
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;

    private Team teamB;
    private Player playerB1;
    private Player playerB2;

    private String rawPasskey = "849201";

    @BeforeEach
    void setUp() {
        String passkeyHash = passwordEncoder.encode(rawPasskey);

        event = eventRepository.save(Event.builder()
                .name("Phase 11 Test Event " + System.currentTimeMillis())
                .description("Final Passkey Event")
                .status(EventStatus.READY)
                .passkeyHash(passkeyHash)
                .build());

        String suffixA = System.currentTimeMillis() + "-PA-" + (int)(Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-PASSKEY-" + suffixA)
                .teamName("Passkey Team A " + suffixA)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder().team(teamA).playerNumber(1).displayName("P1 Passkey A").build());
        playerA2 = playerRepository.save(Player.builder().team(teamA).playerNumber(2).displayName("P2 Passkey A").build());
        gameStateService.initializeTeamGameState(teamA);

        String suffixB = System.currentTimeMillis() + "-PB-" + (int)(Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-PASSKEY-" + suffixB)
                .teamName("Passkey Team B " + suffixB)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder().team(teamB).playerNumber(1).displayName("P1 Passkey B").build());
        playerB2 = playerRepository.save(Player.builder().team(teamB).playerNumber(2).displayName("P2 Passkey B").build());
        gameStateService.initializeTeamGameState(teamB);
    }

    @Test
    @DisplayName("1. Verify team on Level 1..5 cannot submit final passkey (FINAL_NOT_AVAILABLE)")
    void testIneligibilityBeforeLevel6Completion() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();

        FinalPasskeyResponseDto response = finalPasskeyService.submitFinalPasskey(p1, req);

        assertEquals("FINAL_NOT_AVAILABLE", response.getStatus());
        assertNull(response.getCompletedAt());
        assertNotEquals(TeamGameState.COMPLETED, teamRepository.findById(teamA.getId()).orElseThrow().getGameState());
    }

    @Test
    @DisplayName("2. Verify team with all 6 levels completed entering INCORRECT passkey is rejected")
    void testIncorrectPasskeySubmission() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        completeAllSixLevels(p1, p2, teamA);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey("000000").build();
        FinalPasskeyResponseDto response = finalPasskeyService.submitFinalPasskey(p1, req);

        assertEquals("INCORRECT", response.getStatus());
        assertEquals("Incorrect passkey.", response.getMessage());
        assertNull(response.getCompletedAt());

        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(TeamGameState.FINAL_PASSKEY, updatedTeam.getGameState());
        assertNull(updatedTeam.getCompletedAt());
    }

    @Test
    @DisplayName("3. Verify team submitting CORRECT passkey successfully completes CodeXcape")
    void testCorrectPasskeySubmissionCompletesGame() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        completeAllSixLevels(p1, p2, teamA);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();
        FinalPasskeyResponseDto response = finalPasskeyService.submitFinalPasskey(p1, req);

        assertEquals("COMPLETED", response.getStatus());
        assertNotNull(response.getCompletedAt());

        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(TeamGameState.COMPLETED, updatedTeam.getGameState());
        assertNotNull(updatedTeam.getCompletedAt());
    }

    @Test
    @DisplayName("4. Verify ALREADY_COMPLETED idempotency for redundant passkey submissions")
    void testAlreadyCompletedIdempotency() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        completeAllSixLevels(p1, p2, teamA);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();
        FinalPasskeyResponseDto response1 = finalPasskeyService.submitFinalPasskey(p1, req);
        assertEquals("COMPLETED", response1.getStatus());
        Instant initialCompletionTime = response1.getCompletedAt();

        // Player 2 submits passkey afterwards
        FinalPasskeyResponseDto response2 = finalPasskeyService.submitFinalPasskey(p2, req);
        assertEquals("ALREADY_COMPLETED", response2.getStatus());
        assertEquals(initialCompletionTime.toEpochMilli(), response2.getCompletedAt().toEpochMilli());

        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(initialCompletionTime.toEpochMilli(), updatedTeam.getCompletedAt().toEpochMilli());
    }

    @Test
    @DisplayName("5. Verify team isolation (Team A completion does not affect Team B)")
    void testMultiTeamIsolation() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA);
        PlayerPrincipal p1B = createPrincipal(playerB1, teamB);

        completeAllSixLevels(p1A, p2A, teamA);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();
        finalPasskeyService.submitFinalPasskey(p1A, req);

        assertEquals(TeamGameState.COMPLETED, teamRepository.findById(teamA.getId()).orElseThrow().getGameState());
        assertEquals(TeamGameState.IN_PROGRESS, teamRepository.findById(teamB.getId()).orElseThrow().getGameState());

        // Team B attempts passkey submission -> FINAL_NOT_AVAILABLE
        FinalPasskeyResponseDto responseB = finalPasskeyService.submitFinalPasskey(p1B, req);
        assertEquals("FINAL_NOT_AVAILABLE", responseB.getStatus());
    }

    @Test
    @DisplayName("6. Security Audit: Passkey hash is NEVER exposed in DTO responses or strings")
    void testPasskeySecurityProtection() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        completeAllSixLevels(p1, p2, teamA);

        FinalPasskeySubmissionRequest req = FinalPasskeySubmissionRequest.builder().passkey(rawPasskey).build();
        FinalPasskeyResponseDto response = finalPasskeyService.submitFinalPasskey(p1, req);

        String dtoStr = response.toString();
        assertFalse(dtoStr.contains(rawPasskey), "Raw passkey must never be revealed in DTO string.");
        assertFalse(dtoStr.contains(event.getPasskeyHash()), "BCrypt passkey hash must never be revealed in DTO string.");
    }

    private void completeAllSixLevels(PlayerPrincipal p1, PlayerPrincipal p2, Team team) {
        for (int levelNum = 1; levelNum <= 6; levelNum++) {
            Level level = levelRepository.findByLevelNumber(levelNum).orElseThrow();
            Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(p2, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q2.getExpectedAnswerHash()).build());
        }
    }

    private PlayerPrincipal createPrincipal(Player player, Team team) {
        return PlayerPrincipal.builder()
                .playerId(player.getId())
                .teamId(team.getId())
                .eventId(team.getEvent().getId())
                .playerNumber(player.getPlayerNumber())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player.getDisplayName())
                .sessionToken("test-passkey-token-" + player.getId())
                .build();
    }
}
