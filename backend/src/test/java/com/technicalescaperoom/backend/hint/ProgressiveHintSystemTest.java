package com.technicalescaperoom.backend.hint;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.PlayerHintDto;
import com.technicalescaperoom.backend.dto.player.PlayerHintsResponseDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.HintService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class ProgressiveHintSystemTest {

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
    private HintService hintService;

    private Event event;
    private Team teamA;
    private Player playerA1;
    private Player playerA2;

    private Team teamB;
    private Player playerB1;
    private Player playerB2;

    @BeforeEach
    void setUp() {
        event = eventRepository.findAll().stream().findFirst()
                .orElseGet(() -> eventRepository.save(Event.builder()
                        .name("Phase 10 Test Event")
                        .description("Hint System Event")
                        .status(EventStatus.READY)
                        .passkeyHash("$2a$10$7vB9f1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m")
                        .build()));

        String suffixA = System.currentTimeMillis() + "-HA-" + (int)(Math.random() * 10000);
        teamA = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-HINT-" + suffixA)
                .teamName("Hint Team A " + suffixA)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder().team(teamA).playerNumber(1).displayName("Hint P1A").build());
        playerA2 = playerRepository.save(Player.builder().team(teamA).playerNumber(2).displayName("Hint P2A").build());
        gameStateService.initializeTeamGameState(teamA);

        String suffixB = System.currentTimeMillis() + "-HB-" + (int)(Math.random() * 10000);
        teamB = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-HINT-" + suffixB)
                .teamName("Hint Team B " + suffixB)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder().team(teamB).playerNumber(1).displayName("Hint P1B").build());
        playerB2 = playerRepository.save(Player.builder().team(teamB).playerNumber(2).displayName("Hint P2B").build());
        gameStateService.initializeTeamGameState(teamB);
    }

    @Test
    @DisplayName("1. Verify initial state for new team (0 hints unlocked, all hint contents null)")
    void testInitialHintState() {
        PlayerPrincipal p1Principal = createPrincipal(playerA1, teamA);
        PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1Principal);

        assertNotNull(hintsResponse);
        assertEquals(6, hintsResponse.getTotalCount());
        assertEquals(0, hintsResponse.getUnlockedCount());
        assertEquals(6, hintsResponse.getHints().size());

        for (PlayerHintDto hint : hintsResponse.getHints()) {
            assertFalse(hint.getIsUnlocked(), "Hint for Level " + hint.getLevelNumber() + " must be locked initially.");
            assertNull(hint.getHintContent(), "Hint content for locked Level " + hint.getLevelNumber() + " must be NULL.");
        }
    }

    @Test
    @DisplayName("2. Verify Level 1 completion unlocks Hint 1 with content while Hints 2–6 remain locked (content null)")
    void testLevel1CompletionUnlocksHint1() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        Level l1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1_P1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q1_P2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        // Submit correct answers for Level 1
        questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P1.getExpectedAnswerHash()).build());
        questionAnswerService.submitAnswer(p2, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P2.getExpectedAnswerHash()).build());

        PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1);
        assertEquals(1, hintsResponse.getUnlockedCount());

        PlayerHintDto hint1 = hintsResponse.getHints().get(0);
        assertTrue(hint1.getIsUnlocked(), "Hint 1 must be unlocked after Level 1 completion.");
        assertNotNull(hint1.getHintContent(), "Hint 1 content must be populated when unlocked.");
        assertFalse(hint1.getHintContent().isBlank());

        for (int i = 1; i < 6; i++) {
            PlayerHintDto lockedHint = hintsResponse.getHints().get(i);
            assertFalse(lockedHint.getIsUnlocked(), "Hint " + (i + 1) + " must remain locked.");
            assertNull(lockedHint.getHintContent(), "Hint " + (i + 1) + " content must be NULL.");
        }
    }

    @Test
    @DisplayName("3. Verify complete sequential progression from Level 1 to Level 6 unlocks Hints 1 to 6 progressively")
    void testSequentialHintUnlockingThroughLevel6() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        for (int levelNum = 1; levelNum <= 6; levelNum++) {
            Level level = levelRepository.findByLevelNumber(levelNum).orElseThrow();
            Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(p2, AnswerSubmissionRequest.builder().levelNumber(levelNum).answer(q2.getExpectedAnswerHash()).build());

            PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1);
            assertEquals(levelNum, hintsResponse.getUnlockedCount(), "Expected exactly " + levelNum + " unlocked hints after Level " + levelNum + " completion.");

            for (int i = 0; i < levelNum; i++) {
                assertTrue(hintsResponse.getHints().get(i).getIsUnlocked(), "Hint " + (i + 1) + " must be unlocked.");
                assertNotNull(hintsResponse.getHints().get(i).getHintContent(), "Hint " + (i + 1) + " content must not be null.");
            }

            for (int i = levelNum; i < 6; i++) {
                assertFalse(hintsResponse.getHints().get(i).getIsUnlocked(), "Hint " + (i + 1) + " must be locked.");
                assertNull(hintsResponse.getHints().get(i).getHintContent(), "Hint " + (i + 1) + " content must be NULL.");
            }
        }
    }

    @Test
    @DisplayName("4. Verify strict team hint isolation (Team A progress does not leak to Team B)")
    void testTeamHintIsolation() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2A = createPrincipal(playerA2, teamA);

        PlayerPrincipal p1B = createPrincipal(playerB1, teamB);

        // Team A completes Level 1
        Level l1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1_P1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q1_P2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(l1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        questionAnswerService.submitAnswer(p1A, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P1.getExpectedAnswerHash()).build());
        questionAnswerService.submitAnswer(p2A, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1_P2.getExpectedAnswerHash()).build());

        // Team A has Hint 1 unlocked
        PlayerHintsResponseDto hintsA = hintService.getHintsForPlayer(p1A);
        assertEquals(1, hintsA.getUnlockedCount());
        assertTrue(hintsA.getHints().get(0).getIsUnlocked());

        // Team B has 0 hints unlocked
        PlayerHintsResponseDto hintsB = hintService.getHintsForPlayer(p1B);
        assertEquals(0, hintsB.getUnlockedCount());
        assertFalse(hintsB.getHints().get(0).getIsUnlocked());
        assertNull(hintsB.getHints().get(0).getHintContent());
    }

    @Test
    @DisplayName("5. Security Audit: Passkey hash and locked hint contents are NEVER exposed in DTO responses")
    void testSecurityPasskeyAndLockedContentProtection() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerHintsResponseDto response = hintService.getHintsForPlayer(p1);

        String responseString = response.toString();

        // Passkey hash must not appear anywhere in stringified DTO
        assertFalse(responseString.contains(event.getPasskeyHash()), "Passkey hash must never be present in hint DTO response.");

        // Locked hint contents must be strictly null
        for (PlayerHintDto hint : response.getHints()) {
            if (!hint.getIsUnlocked()) {
                assertNull(hint.getHintContent(), "Locked hint content must be strictly null.");
            }
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
                .sessionToken("test-hint-token-" + player.getId())
                .build();
    }
}
