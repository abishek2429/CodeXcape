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
    @DisplayName("1. Verify initial state for new team (15 independent stage hints, 0 hints unlocked, all contents null)")
    void testInitialHintState() {
        PlayerPrincipal p1Principal = createPrincipal(playerA1, teamA);
        PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1Principal);

        assertNotNull(hintsResponse);
        assertEquals(15, hintsResponse.getTotalCount(), "Expected exactly 15 stage hints.");
        assertEquals(0, hintsResponse.getUnlockedCount());
        assertEquals(15, hintsResponse.getHints().size());

        for (PlayerHintDto hint : hintsResponse.getHints()) {
            assertFalse(hint.getIsUnlocked(), "Hint for Level " + hint.getLevelNumber() + " Stage " + hint.getStageNumber() + " must be locked initially.");
            assertNull(hint.getHintContent(), "Hint content for locked Level " + hint.getLevelNumber() + " Stage " + hint.getStageNumber() + " must be NULL.");
        }
    }

    @Test
    @DisplayName("2. Completing Level 1 without clicking REVEAL HINT never automatically reveals hints (TEST 1 & TEST 4)")
    void testLevelCompletionDoesNotAutoRevealHints() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);
        PlayerPrincipal p2 = createPrincipal(playerA2, teamA);

        // Submit correct answers for Level 1 (all stages)
        completeLevel(1, p1, p2);

        // Verify hints remain strictly locked
        PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1);
        assertEquals(0, hintsResponse.getUnlockedCount(), "Completing a level must NEVER automatically unlock hints.");
        assertEquals(0, teamA.getHintPenalty(), "No hint penalty should be applied on completion.");

        for (PlayerHintDto hint : hintsResponse.getHints()) {
            assertFalse(hint.getIsUnlocked(), "All hints must remain locked.");
            assertNull(hint.getHintContent(), "Locked hint content must remain NULL.");
        }
    }

    @Test
    @DisplayName("3. Explicit hint reveal deducts 5 points, displays actual hint, and prevents duplicate charges (TEST 2, TEST 3, TEST 6)")
    void testExplicitHintRevealAndDuplicatePrevention() {
        PlayerPrincipal p1 = createPrincipal(playerA1, teamA);

        // Initial team hint penalty is 0
        assertEquals(0, teamA.getHintPenalty());

        // Reveal Level 1 Stage 1 hint
        var revealRes1 = hintService.useHint(p1, 1, 1, 1);
        assertNotNull(revealRes1.getHintContent(), "Revealed hint content must be returned.");
        assertFalse(revealRes1.getHintContent().isBlank(), "Hint content must not be blank.");
        assertFalse(revealRes1.isAlreadyUsed());

        Team updatedTeam = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(5, updatedTeam.getHintPenalty(), "Hint penalty must be exactly 5 points.");

        // Second click / repeat request: must NOT charge another 5 points
        var revealRes2 = hintService.useHint(p1, 1, 1, 1);
        assertTrue(revealRes2.isAlreadyUsed(), "Second reveal must be marked as already used.");
        assertEquals(revealRes1.getHintContent(), revealRes2.getHintContent(), "Should return the same hint content.");

        Team updatedTeam2 = teamRepository.findById(teamA.getId()).orElseThrow();
        assertEquals(5, updatedTeam2.getHintPenalty(), "No additional penalty for duplicate hint reveal.");

        // Verify in getHintsForPlayer: Level 1 Stage 1 is unlocked, Stage 2 is locked (TEST 5)
        PlayerHintsResponseDto hintsResponse = hintService.getHintsForPlayer(p1);
        assertEquals(1, hintsResponse.getUnlockedCount());

        PlayerHintDto l1s1 = hintsResponse.getHints().stream()
                .filter(h -> h.getLevelNumber() == 1 && h.getStageNumber() == 1)
                .findFirst().orElseThrow();
        assertTrue(l1s1.getIsUnlocked());
        assertNotNull(l1s1.getHintContent());

        PlayerHintDto l1s2 = hintsResponse.getHints().stream()
                .filter(h -> h.getLevelNumber() == 1 && h.getStageNumber() == 2)
                .findFirst().orElseThrow();
        assertFalse(l1s2.getIsUnlocked());
        assertNull(l1s2.getHintContent());
    }

    @Test
    @DisplayName("4. Verify strict team hint isolation (Team A reveals hint, Team B remains locked)")
    void testTeamHintIsolation() {
        PlayerPrincipal p1A = createPrincipal(playerA1, teamA);
        PlayerPrincipal p1B = createPrincipal(playerB1, teamB);

        // Team A reveals Level 1 Stage 1 hint
        hintService.useHint(p1A, 1, 1, 1);

        // Team A has 1 hint unlocked
        PlayerHintsResponseDto hintsA = hintService.getHintsForPlayer(p1A);
        assertEquals(1, hintsA.getUnlockedCount());

        // Team B has 0 hints unlocked
        PlayerHintsResponseDto hintsB = hintService.getHintsForPlayer(p1B);
        assertEquals(0, hintsB.getUnlockedCount());
        for (PlayerHintDto hint : hintsB.getHints()) {
            assertFalse(hint.getIsUnlocked());
            assertNull(hint.getHintContent());
        }
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

    private void completeLevel(int levelNumber, PlayerPrincipal p1, PlayerPrincipal p2) {
        Level level = levelRepository.findByLevelNumber(levelNumber).orElseThrow();
        int totalStages = questionRepository.findByLevelIdAndIsActiveTrue(level.getId()).stream()
                .map(Question::getStageNumber)
                .max(Integer::compareTo)
                .orElse(1);
        for (int stage = 1; stage <= totalStages; stage++) {
            Question q1 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                    level.getId(), stage, QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndStageNumberAndPlayerNumberAndIsActiveTrue(
                    level.getId(), stage, QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(p1, AnswerSubmissionRequest.builder().levelNumber(levelNumber).answer(q1.getExpectedAnswerHash()).build());
            questionAnswerService.submitAnswer(p2, AnswerSubmissionRequest.builder().levelNumber(levelNumber).answer(q2.getExpectedAnswerHash()).build());
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
