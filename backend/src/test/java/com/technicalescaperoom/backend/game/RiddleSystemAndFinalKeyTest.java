package com.technicalescaperoom.backend.game;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeyResponseDto;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.dto.player.RiddleDto.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.FinalPasskeyService;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import com.technicalescaperoom.backend.service.RiddleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RiddleSystemAndFinalKeyTest {

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
    private RiddleService riddleService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private Event event;
    private Team team;
    private Player player1;
    private Player player2;

    private PlayerPrincipal principal1;
    private PlayerPrincipal principal2;

    @BeforeEach
    void setUp() {
        event = eventRepository.save(Event.builder()
                .name("Riddle System Test Event " + System.currentTimeMillis())
                .description("Testing 6 Riddles and Final Key")
                .status(EventStatus.READY)
                .passkeyHash(passwordEncoder.encode("382459"))
                .build());

        String suffix = System.currentTimeMillis() + "-" + (int)(Math.random() * 10000);
        team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("RIDDLE-TEAM-" + suffix)
                .teamName("Riddle Test Team " + suffix)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        player1 = playerRepository.save(Player.builder().team(team).playerNumber(1).displayName("Operator Alpha").build());
        player2 = playerRepository.save(Player.builder().team(team).playerNumber(2).displayName("Operator Beta").build());
        gameStateService.initializeTeamGameState(team);

        principal1 = PlayerPrincipal.builder()
                .playerId(player1.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(1)
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player1.getDisplayName())
                .sessionToken("test-token-1")
                .build();

        principal2 = PlayerPrincipal.builder()
                .playerId(player2.getId())
                .teamId(team.getId())
                .eventId(event.getId())
                .playerNumber(2)
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player2.getDisplayName())
                .sessionToken("test-token-2")
                .build();
    }

    @Test
    @DisplayName("1. Level 1 complete unlocks Riddle 1; future riddles remain locked and reject submissions")
    void testRiddleUnlockingProgression() {
        // Initial state: Level 1 not completed
        RiddleBoardStateResponseDto initialBoard = riddleService.getRiddleBoardState(principal1);
        assertEquals(0, initialBoard.getUnlockedCount());
        assertEquals(0, initialBoard.getSolvedCount());
        assertFalse(initialBoard.getAllRiddlesSolved());
        assertEquals("LOCKED", initialBoard.getRiddles().get(0).getStatus());

        // Complete Level 1
        completeLevel(1);

        // Riddle 1 should now be UNLOCKED; Riddles 2..6 must remain LOCKED
        RiddleBoardStateResponseDto boardAfterL1 = riddleService.getRiddleBoardState(principal1);
        assertEquals(1, boardAfterL1.getUnlockedCount());
        assertEquals(0, boardAfterL1.getSolvedCount());
        assertEquals("UNLOCKED", boardAfterL1.getRiddles().get(0).getStatus());
        assertEquals("LOCKED", boardAfterL1.getRiddles().get(1).getStatus());

        // Attempting to submit to Riddle 2 directly must be rejected by backend
        RiddleSubmissionResponseDto directLockedAttempt = riddleService.submitRiddleAnswer(
                principal1,
                RiddleSubmissionRequest.builder().riddleIndex(2).digit("8").build()
        );
        assertEquals("LOCKED", directLockedAttempt.getStatus());
        assertTrue(directLockedAttempt.getMessage().contains("locked"));
    }

    @Test
    @DisplayName("2. Players can ignore Riddle 1, continue to next levels, and solve riddles cooperatively later")
    void testIndependentSolvingAndCooperativeTeamState() {
        // Complete Level 1 and Level 2 without solving any riddles
        completeLevel(1);
        completeLevel(2);

        RiddleBoardStateResponseDto board = riddleService.getRiddleBoardState(principal1);
        assertEquals(2, board.getUnlockedCount());
        assertEquals("UNLOCKED", board.getRiddles().get(0).getStatus());
        assertEquals("UNLOCKED", board.getRiddles().get(1).getStatus());
        assertEquals("LOCKED", board.getRiddles().get(2).getStatus());

        // Player 1 solves Riddle 1 with correct digit (3)
        RiddleSubmissionResponseDto r1Response = riddleService.submitRiddleAnswer(
                principal1,
                RiddleSubmissionRequest.builder().riddleIndex(1).digit("3").build()
        );
        assertEquals("SOLVED", r1Response.getStatus());
        assertEquals("3", r1Response.getSolvedDigit());

        // Player 2 immediately sees Riddle 1 as SOLVED with solvedDigit "3"
        RiddleBoardStateResponseDto p2Board = riddleService.getRiddleBoardState(principal2);
        assertEquals("SOLVED", p2Board.getRiddles().get(0).getStatus());
        assertEquals("3", p2Board.getRiddles().get(0).getSolvedDigit());
        assertEquals(1, p2Board.getSolvedCount());

        // Player 2 solves Riddle 2 with correct digit (8)
        RiddleSubmissionResponseDto r2Response = riddleService.submitRiddleAnswer(
                principal2,
                RiddleSubmissionRequest.builder().riddleIndex(2).digit("8").build()
        );
        assertEquals("SOLVED", r2Response.getStatus());
        assertEquals("8", r2Response.getSolvedDigit());

        // Both players now see Riddles 1 and 2 SOLVED
        RiddleBoardStateResponseDto p1Board = riddleService.getRiddleBoardState(principal1);
        assertEquals("SOLVED", p1Board.getRiddles().get(0).getStatus());
        assertEquals("SOLVED", p1Board.getRiddles().get(1).getStatus());
        assertEquals(2, p1Board.getSolvedCount());
    }

    @Test
    @DisplayName("3. Incorrect riddle submission does not solve riddle or leak answer; rate-limiting protects against brute-force")
    void testIncorrectSubmissionAndRateLimiting() {
        completeLevel(1);

        // Wrong submission (e.g. 7 instead of 3)
        RiddleSubmissionResponseDto wrongResponse = riddleService.submitRiddleAnswer(
                principal1,
                RiddleSubmissionRequest.builder().riddleIndex(1).digit("7").build()
        );
        assertEquals("INCORRECT", wrongResponse.getStatus());
        assertNull(wrongResponse.getSolvedDigit());

        // Board still shows UNLOCKED
        RiddleBoardStateResponseDto board = riddleService.getRiddleBoardState(principal1);
        assertEquals("UNLOCKED", board.getRiddles().get(0).getStatus());
        assertNull(board.getRiddles().get(0).getSolvedDigit());

        // Immediate subsequent submission triggers rate limit (< 2 seconds cooldown)
        RiddleSubmissionResponseDto rateLimitResponse = riddleService.submitRiddleAnswer(
                principal1,
                RiddleSubmissionRequest.builder().riddleIndex(1).digit("1").build()
        );
        assertEquals("RATE_LIMITED", rateLimitResponse.getStatus());
    }

    @Test
    @DisplayName("4. Final Key Terminal is LOCKED until all 6 levels completed AND all 6 riddles solved")
    void testFinalKeyPrerequisitesEnforced() {
        // Complete all 6 levels so team enters FINAL_PASSKEY state
        for (int i = 1; i <= 6; i++) {
            completeLevel(i);
        }

        Team updatedTeam = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(TeamGameState.FINAL_PASSKEY, updatedTeam.getGameState());

        // Only solve 5 of the 6 riddles
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(1).digit("3").build());
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(2).digit("8").build());
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(3).digit("2").build());
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(4).digit("4").build());
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(5).digit("5").build());

        assertFalse(riddleService.areAllRiddlesSolvedForTeam(team.getId()));

        // Attempting to submit the final key must be rejected because Riddle 6 is not yet solved
        FinalPasskeyResponseDto blockedResponse = finalPasskeyService.submitFinalPasskey(
                principal1,
                FinalPasskeySubmissionRequest.builder().passkey("382459").build()
        );
        assertEquals("FINAL_NOT_AVAILABLE", blockedResponse.getStatus());
        assertTrue(blockedResponse.getMessage().contains("solve all 6 riddles"));
        assertNull(blockedResponse.getCompletedAt());
    }

    @Test
    @DisplayName("5. Full End-to-End: Solve Riddles 1–6 -> Combine digits (382459) -> Submit Final Key -> Game Completed")
    void testFullEndToEndCompletionFlow() {
        // 1. Complete levels 1 through 6
        for (int i = 1; i <= 6; i++) {
            completeLevel(i);
        }

        // 2. Solve all 6 riddles in level order
        // Riddle 1: 3
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(1).digit("3").build());
        // Riddle 2: 8
        riddleService.submitRiddleAnswer(principal2, RiddleSubmissionRequest.builder().riddleIndex(2).digit("8").build());
        // Riddle 3: 2
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(3).digit("2").build());
        // Riddle 4: 4
        riddleService.submitRiddleAnswer(principal2, RiddleSubmissionRequest.builder().riddleIndex(4).digit("4").build());
        // Riddle 5: 5
        riddleService.submitRiddleAnswer(principal1, RiddleSubmissionRequest.builder().riddleIndex(5).digit("5").build());
        // Riddle 6: 9
        riddleService.submitRiddleAnswer(principal2, RiddleSubmissionRequest.builder().riddleIndex(6).digit("9").build());

        assertTrue(riddleService.areAllRiddlesSolvedForTeam(team.getId()));

        // 3. Test wrong 6-digit key submission is rejected
        FinalPasskeyResponseDto wrongPasskey = finalPasskeyService.submitFinalPasskey(
                principal1,
                FinalPasskeySubmissionRequest.builder().passkey("999999").build()
        );
        assertEquals("INCORRECT", wrongPasskey.getStatus());
        assertNull(wrongPasskey.getCompletedAt());

        // 4. Test derived 6-digit key (382459) authorizes escape
        FinalPasskeyResponseDto correctPasskey = finalPasskeyService.submitFinalPasskey(
                principal1,
                FinalPasskeySubmissionRequest.builder().passkey("382459").build()
        );
        assertEquals("COMPLETED", correctPasskey.getStatus());
        assertNotNull(correctPasskey.getCompletedAt());

        Team completedTeam = teamRepository.findById(team.getId()).orElseThrow();
        assertEquals(TeamGameState.COMPLETED, completedTeam.getGameState());
        assertNotNull(completedTeam.getCompletedAt());

        // 5. Test idempotency: re-submitting returns ALREADY_COMPLETED
        FinalPasskeyResponseDto replayResponse = finalPasskeyService.submitFinalPasskey(
                principal2,
                FinalPasskeySubmissionRequest.builder().passkey("382459").build()
        );
        assertEquals("ALREADY_COMPLETED", replayResponse.getStatus());
    }

    private void completeLevel(int levelNum) {
        Level level = levelRepository.findByLevelNumber(levelNum).orElseThrow();
        int totalStages = questionRepository.findByLevelIdAndIsActiveTrue(level.getId()).stream()
                .map(Question::getStageNumber)
                .max(Integer::compareTo)
                .orElse(1);

        for (int stage = 1; stage <= totalStages; stage++) {
            Question q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                    level.getId(), stage, QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                    level.getId(), stage, QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(principal1, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(principal2, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q2.getExpectedAnswerHash()).build());
        }
    }
}
