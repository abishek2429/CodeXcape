package com.technicalescaperoom.backend.content;

import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.IncompleteLevelContentException;
import com.technicalescaperoom.backend.exception.InvalidLevelTransitionException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import com.technicalescaperoom.backend.service.content.LevelContentValidationService;
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
class SixLevelContentSystemTest {

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private LevelContentValidationService levelContentValidationService;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;

    @BeforeEach
    void setUp() {
        event = eventRepository.findAll().stream().findFirst()
                .orElseGet(() -> eventRepository.save(Event.builder()
                        .name("Phase 9 Test Event")
                        .description("Content System Event")
                        .status(EventStatus.READY)
                        .passkeyHash("$2a$10$7vB9f1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m")
                        .build()));

        String uniqueSuffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 10000);

        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-CONTENT-" + uniqueSuffix)
                .teamName("Content Testers " + uniqueSuffix)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(1)
                .displayName("Alpha Player 1")
                .status(PlayerStatus.INACTIVE)
                .build());

        playerA2 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(2)
                .displayName("Alpha Player 2")
                .status(PlayerStatus.INACTIVE)
                .build());

        gameStateService.initializeTeamGameState(teamA);
    }

    @Test
    @DisplayName("1. Verify all 6 levels exist with metadata (levelNumber, name, description, difficulty, isActive)")
    void testSixLevelStructureAndMetadata() {
        List<Level> levels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        assertEquals(6, levels.size(), "System must configure exactly 6 active game levels.");

        for (int i = 1; i <= 6; i++) {
            final int levelNum = i;
            Level level = levels.stream()
                    .filter(l -> l.getLevelNumber() == levelNum)
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Level " + levelNum + " does not exist."));

            assertNotNull(level.getName(), "Level " + levelNum + " name cannot be null.");
            assertNotNull(level.getDescription(), "Level " + levelNum + " description cannot be null.");
            assertNotNull(level.getDifficulty(), "Level " + levelNum + " difficulty cannot be null.");
            assertTrue(level.getIsActive(), "Level " + levelNum + " must be active.");
        }
    }

    @Test
    @DisplayName("2. Verify each active level has exactly 1 active Player 1 and 1 active Player 2 question")
    void testLevelQuestionStructure() {
        List<Level> levels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        assertEquals(6, levels.size());

        for (Level level : levels) {
            List<Question> questions = questionRepository.findByLevelIdAndIsActiveTrue(level.getId());
            assertEquals(2, questions.size(), "Level " + level.getLevelNumber() + " must have exactly 2 questions.");

            long p1Count = questions.stream().filter(q -> q.getPlayerNumber() == QuestionPlayer.PLAYER_1).count();
            long p2Count = questions.stream().filter(q -> q.getPlayerNumber() == QuestionPlayer.PLAYER_2).count();

            assertEquals(1, p1Count, "Level " + level.getLevelNumber() + " must have 1 active P1 question.");
            assertEquals(1, p2Count, "Level " + level.getLevelNumber() + " must have 1 active P2 question.");
        }
    }

    @Test
    @DisplayName("3. Verify strict Player 1 vs Player 2 Question Isolation")
    void testPlayerQuestionIsolation() {
        PlayerPrincipal p1Principal = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2Principal = createPrincipal(playerA2, teamA);

        PlayerQuestionDto p1Question = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
        PlayerQuestionDto p2Question = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);

        assertEquals(1, p1Question.getLevelNumber());
        assertEquals(1, p2Question.getLevelNumber());
        assertNotEquals(p1Question.getQuestionId(), p2Question.getQuestionId(), "P1 and P2 must receive distinct questions.");
        assertNotEquals(p1Question.getQuestionContent(), p2Question.getQuestionContent(), "P1 and P2 question contents must be distinct.");

        assertNotNull(p1Question.getPuzzleContext());
        assertEquals(p1Question.getPuzzleContext(), p2Question.getPuzzleContext(), "P1 and P2 in Level 1 share the same puzzle context.");
    }

    @Test
    @DisplayName("4. Verify complete 6-level sequential progression from Level 1 to Level 6 with distinct level content")
    void testSixLevelSequentialProgression() {
        for (int levelNum = 1; levelNum <= 6; levelNum++) {
            PlayerPrincipal p1Principal = createPrincipal(playerA1, teamA);
            PlayerPrincipal p2Principal = createPrincipal(playerA2, teamA);

            PlayerQuestionDto p1Dto = questionAnswerService.getCurrentQuestionForPlayer(p1Principal);
            PlayerQuestionDto p2Dto = questionAnswerService.getCurrentQuestionForPlayer(p2Principal);

            assertEquals(levelNum, p1Dto.getLevelNumber());
            assertEquals(levelNum, p2Dto.getLevelNumber());

            // Fetch actual expected answers for testing level progression
            Level currentLevel = levelRepository.findByLevelNumber(levelNum).orElseThrow();
            Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(currentLevel.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

            // Submit correct answers for both players
            questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(p2Principal, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q2.getExpectedAnswerHash()).build());
        }

        // Verify team transitioned to FINAL_PASSKEY after Level 6 completion
        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(TeamGameState.FINAL_PASSKEY, updatedTeam.getGameState());
    }

    @Test
    @DisplayName("5. Verify future-level protection (Team on Level 1 cannot fetch or answer Level 2 questions)")
    void testFutureLevelProtection() {
        PlayerPrincipal p1Principal = createPrincipal(playerA1, teamA);

        // Player is on Level 1. Submitting answer for Level 2 should throw InvalidLevelTransitionException
        assertThrows(InvalidLevelTransitionException.class, () -> {
            questionAnswerService.submitAnswer(p1Principal, AnswerSubmissionRequest.builder().levelNumber(2).answer("22").build());
        });
    }

    @Test
    @DisplayName("6. Verify server-side content integrity validation fails for incomplete level content")
    void testContentIntegrityValidation() {
        // Test validating all active levels passes cleanly initially
        assertDoesNotThrow(() -> levelContentValidationService.validateAllActiveLevelsContent());

        Level level6 = levelRepository.findByLevelNumber(6).orElseThrow();
        Question p2Question = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level6.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        // Deactivate P2 question to simulate incomplete level content (missing P2 challenge)
        p2Question.setIsActive(false);
        questionRepository.save(p2Question);

        assertThrows(IncompleteLevelContentException.class, () -> {
            levelContentValidationService.validateLevelContent(level6);
        }, "Level with missing active P2 question must throw IncompleteLevelContentException.");
    }

    @Test
    @DisplayName("7. Verify multiple teams reuse the same 6-level questions without duplicating content or leaking progress")
    void testMultiTeamContentReuseAndIsolation() {
        String suffixB = System.currentTimeMillis() + "-B";
        Team teamB = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-CONTENT-" + suffixB)
                .teamName("Content Team B")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        Player playerB1 = playerRepository.save(Player.builder().team(teamB).playerNumber(1).displayName("Player B1").build());
        Player playerB2 = playerRepository.save(Player.builder().team(teamB).playerNumber(2).displayName("Player B2").build());
        gameStateService.initializeTeamGameState(teamB);

        // Both Team A and Team B are on Level 1
        PlayerQuestionDto qA1 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        PlayerQuestionDto qB1 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerB1, teamB));

        // Content IDs and content strings are identical (reused question rows)
        assertEquals(qA1.getQuestionId(), qB1.getQuestionId());
        assertEquals(qA1.getQuestionContent(), qB1.getQuestionContent());

        // Team A completes Level 1
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1_P1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q1_P2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P1.getExpectedAnswerHash()).build());
        questionAnswerService.submitAnswer(createPrincipal(playerA2, teamA), AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P2.getExpectedAnswerHash()).build());

        // Team A is now on Level 2, while Team B remains on Level 1
        PlayerQuestionDto qA2_L2 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        PlayerQuestionDto qB1_StillL1 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerB1, teamB));

        assertEquals(2, qA2_L2.getLevelNumber(), "Team A progressed to Level 2.");
        assertEquals(1, qB1_StillL1.getLevelNumber(), "Team B remains isolated on Level 1.");
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
                .sessionToken("test-token-content-" + player.getId())
                .build();
    }
}
