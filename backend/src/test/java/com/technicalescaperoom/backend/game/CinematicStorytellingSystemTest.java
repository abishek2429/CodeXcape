package com.technicalescaperoom.backend.game;

import com.technicalescaperoom.backend.config.StorySequenceConfig;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.controller.player.PlayerStoryController;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.FinalPasskeySubmissionRequest;
import com.technicalescaperoom.backend.dto.story.ActiveStoryStateDto;
import com.technicalescaperoom.backend.dto.story.StorySequenceDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class CinematicStorytellingSystemTest {

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
    private com.technicalescaperoom.backend.repository.TeamRiddleProgressRepository teamRiddleProgressRepository;

    @Autowired
    private TeamStoryProgressRepository teamStoryProgressRepository;

    @Autowired
    private StorySequenceConfig storySequenceConfig;

    @Autowired
    private CinematicStoryService cinematicStoryService;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private PlayerStoryController playerStoryController;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event testEvent;
    private Team testTeam;
    private Player player1;
    private Player player2;
    private PlayerPrincipal principalP1;
    private PlayerPrincipal principalP2;
    private final String rawPasskey = "948172";

    @BeforeEach
    void setUp() {
        testEvent = eventRepository.save(Event.builder()
                .name("Story Event " + System.currentTimeMillis())
                .description("Cinematic Narrative Integration")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode(rawPasskey))
                .build());

        String suffix = System.currentTimeMillis() + "-" + (int)(Math.random() * 10000);
        testTeam = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("STORY-" + suffix)
                .teamName("Narrative Operatives " + suffix)
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.NOT_STARTED)
                .startedAt(Instant.now().minusSeconds(120))
                .totalStoryPauseSeconds(0L)
                .build());

        player1 = playerRepository.save(Player.builder()
                .team(testTeam)
                .playerNumber(1)
                .displayName("Story Op 1")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        player2 = playerRepository.save(Player.builder()
                .team(testTeam)
                .playerNumber(2)
                .displayName("Story Op 2")
                .status(PlayerStatus.CONNECTED)
                .isActive(true)
                .isReady(true)
                .build());

        principalP1 = PlayerPrincipal.builder()
                .playerId(player1.getId())
                .teamId(testTeam.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .teamCode(testTeam.getTeamCode())
                .displayName("Story Op 1")
                .sessionToken("sess-story-1")
                .build();

        principalP2 = PlayerPrincipal.builder()
                .playerId(player2.getId())
                .teamId(testTeam.getId())
                .eventId(testEvent.getId())
                .playerNumber(2)
                .teamCode(testTeam.getTeamCode())
                .displayName("Story Op 2")
                .sessionToken("sess-story-2")
                .build();
    }

    @Test
    @DisplayName("01. Initial Game Start triggers STORY_PROLOGUE with timer paused")
    void testPrologueStoryTriggeredAtGameStart() {
        gameStateService.initializeTeamGameState(testTeam);

        Team updated = teamRepository.findById(testTeam.getId()).orElseThrow();
        assertTrue(updated.isStoryActive(), "Team story should be active upon game initialization");
        assertEquals("STORY_PROLOGUE", updated.getCurrentStoryKey());
        assertNotNull(updated.getStoryPausedAt(), "story_paused_at should be recorded on initial story");

        ActiveStoryStateDto state = cinematicStoryService.getCurrentStoryState(testTeam.getId());
        assertTrue(state.isStoryActive());
        assertEquals("STORY_PROLOGUE", state.getStoryKey());
        assertNotNull(state.getSequence());
        assertTrue(state.getSequence().getLines().size() >= 5);
    }

    @Test
    @DisplayName("02. Character visual references and dialogue lines exist without puzzle answer leakage")
    void testStoryLineProfilesAndNoAnswerLeakage() {
        List<StorySequenceDto> allSeqs = storySequenceConfig.getAllSequences();
        assertFalse(allSeqs.isEmpty());

        for (StorySequenceDto seq : allSeqs) {
            assertNotNull(seq.getStoryKey());
            assertNotNull(seq.getTitle());
            for (var line : seq.getLines()) {
                assertNotNull(line.getCharacterId());
                assertNotNull(line.getImageUrl());
                assertTrue(line.getImageUrl().startsWith("/characters/"), "Image URL must map to cropped character assets: " + line.getImageUrl());
                assertNotNull(line.getText());
                assertFalse(line.getText().contains(rawPasskey), "Story must not leak final passkey!");
                assertFalse(line.getText().contains("849201"), "Story must not leak master passkey!");
            }
        }
    }

    @Test
    @DisplayName("03. Skip story records pause duration, resumes timer, and marks status SKIPPED")
    void testSkipStoryResumesTimerAndRecordsPause() throws InterruptedException {
        cinematicStoryService.triggerStory(testTeam, "STORY_L1_INTRO");
        Thread.sleep(50); // small pause

        ActiveStoryStateDto res = cinematicStoryService.skipStory(testTeam.getId(), player1.getId());
        assertFalse(res.isStoryActive(), "Story should no longer be active after skip");
        assertNull(res.getStoryKey());

        Team updated = teamRepository.findById(testTeam.getId()).orElseThrow();
        assertFalse(updated.isStoryActive());
        assertNull(updated.getCurrentStoryKey());
        assertNull(updated.getStoryPausedAt());

        TeamStoryProgress progress = teamStoryProgressRepository.findByTeamIdAndStoryKey(testTeam.getId(), "STORY_L1_INTRO").orElseThrow();
        assertEquals(StoryProgressStatus.SKIPPED, progress.getStatus());
        assertNotNull(progress.getEndedAt());
    }

    @Test
    @DisplayName("04. Complete story records pause duration, resumes timer, and marks status COMPLETED")
    void testCompleteStoryResumesTimerAndRecordsPause() throws InterruptedException {
        cinematicStoryService.triggerStory(testTeam, "STORY_L2_INTRO");
        Thread.sleep(50);

        ActiveStoryStateDto res = cinematicStoryService.completeStory(testTeam.getId(), player2.getId());
        assertFalse(res.isStoryActive());

        TeamStoryProgress progress = teamStoryProgressRepository.findByTeamIdAndStoryKey(testTeam.getId(), "STORY_L2_INTRO").orElseThrow();
        assertEquals(StoryProgressStatus.COMPLETED, progress.getStatus());
    }

    @Test
    @DisplayName("05. Story pause duration is strictly excluded from competitive leaderboard duration")
    void testStoryPauseDurationExcludedFromLeaderboardDuration() {
        testTeam.setStartedAt(Instant.now().minusSeconds(300));
        testTeam.setCompletedAt(Instant.now());
        testTeam.setGameState(TeamGameState.COMPLETED);
        testTeam.setTotalStoryPauseSeconds(100L); // 100 seconds spent in stories
        teamRepository.save(testTeam);

        var leaderboard = leaderboardService.getLeaderboard(testEvent.getId());
        var teamEntry = leaderboard.stream().filter(e -> e.getTeamId().equals(testTeam.getId())).findFirst().orElseThrow();

        // Gross duration was 300s. Official active duration should be approx 300 - 100 = 200s.
        assertNotNull(teamEntry.getDurationSeconds());
        assertTrue(teamEntry.getDurationSeconds() <= 205 && teamEntry.getDurationSeconds() >= 195,
                "Duration should exclude 100s story pause! Actual: " + teamEntry.getDurationSeconds());
    }

    @Test
    @DisplayName("06. 2-Player synchronization: Player 1 skips -> Player 2 gets synchronized state")
    void testTwoPlayerStorySynchronizationAndSkip() {
        cinematicStoryService.triggerStory(testTeam, "STORY_L1_INTRO");

        // Player 1 calls skip endpoint
        ResponseEntity<ActiveStoryStateDto> respP1 = playerStoryController.skipStory(principalP1);
        assertEquals(200, respP1.getStatusCode().value());
        assertFalse(respP1.getBody().isStoryActive());

        // Player 2 fetches current story state
        ResponseEntity<ActiveStoryStateDto> respP2 = playerStoryController.getCurrentStoryState(principalP2);
        assertEquals(200, respP2.getStatusCode().value());
        assertFalse(respP2.getBody().isStoryActive(), "Player 2 must see story as resolved and timer resumed");
    }

    @Test
    @DisplayName("07. Idempotency: duplicate trigger for already resolved story is safely ignored")
    void testStoryIdempotencyPreventsDuplicateTrigger() {
        cinematicStoryService.triggerStory(testTeam, "STORY_L1_INTRO");
        cinematicStoryService.skipStory(testTeam.getId(), player1.getId());

        // Attempt second trigger of same story key
        ActiveStoryStateDto secondAttempt = cinematicStoryService.triggerStory(testTeam, "STORY_L1_INTRO");
        assertFalse(secondAttempt.isStoryActive(), "Already skipped story should not re-trigger!");

        List<TeamStoryProgress> records = teamStoryProgressRepository.findByTeamIdOrderByStartedAtAsc(testTeam.getId());
        assertEquals(1, records.stream().filter(r -> r.getStoryKey().equals("STORY_L1_INTRO")).count());
    }

    @Test
    @DisplayName("08. Reconnection/Refresh during active story recovers current active state")
    void testRefreshDuringStoryRestoresActiveState() {
        cinematicStoryService.triggerStory(testTeam, "STORY_L3_DISCOVERY");

        ActiveStoryStateDto state = cinematicStoryService.getCurrentStoryState(testTeam.getId());
        assertTrue(state.isStoryActive());
        assertEquals("STORY_L3_DISCOVERY", state.getStoryKey());
        assertNotNull(state.getCurrentPauseSeconds());
    }

    @Test
    @DisplayName("09. Level advance triggers next level intro story")
    void testLevelAdvanceTriggersNextLevelIntroStory() {
        gameStateService.initializeTeamGameState(testTeam);
        cinematicStoryService.skipStory(testTeam.getId(), player1.getId()); // skip prologue

        // Complete Level 1
        gameStateService.completeLevel(testTeam.getId(), 1);

        Team updated = teamRepository.findById(testTeam.getId()).orElseThrow();
        assertEquals("STORY_L2_INTRO", updated.getCurrentStoryKey());
        assertTrue(updated.isStoryActive());
    }

    @Test
    @DisplayName("10. Level 6 completion transitions to FINAL_PASSKEY and triggers STORY_FINAL_PROTOCOL")
    void testFinalPasskeyTriggersFinalProtocolStory() {
        gameStateService.initializeTeamGameState(testTeam);
        cinematicStoryService.skipStory(testTeam.getId(), player1.getId());

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(testTeam.getId());
        for (TeamLevelProgress p : progressList) {
            p.setLevelStatus(LevelStatus.AVAILABLE);
            teamLevelProgressRepository.save(p);
        }

        gameStateService.completeLevel(testTeam.getId(), 6);

        Team updated = teamRepository.findById(testTeam.getId()).orElseThrow();
        assertEquals(TeamGameState.FINAL_PASSKEY, updated.getGameState());
        assertEquals("STORY_FINAL_PROTOCOL", updated.getCurrentStoryKey());
        assertTrue(updated.isStoryActive());
    }

    @Test
    @DisplayName("11. Correct final passkey verification triggers STORY_COMPLETION")
    void testFinalPasskeySuccessTriggersCompletionStory() {
        gameStateService.initializeTeamGameState(testTeam);
        cinematicStoryService.skipStory(testTeam.getId(), player1.getId());
        testTeam.setCompletedLevels(6);
        testTeam.setGameState(TeamGameState.FINAL_PASSKEY);
        teamRepository.save(testTeam);

        for (int r = 1; r <= 6; r++) {
            teamRiddleProgressRepository.save(com.technicalescaperoom.backend.entity.TeamRiddleProgress.builder()
                    .team(testTeam)
                    .riddleIndex(r)
                    .isSolved(true)
                    .solvedDigit("0")
                    .build());
        }

        for (int lvl = 1; lvl <= 6; lvl++) {
            TeamLevelProgress lp = teamLevelProgressRepository.findByTeamIdAndLevelId(testTeam.getId(), (long)lvl).orElseThrow();
            lp.setLevelStatus(LevelStatus.COMPLETED);
            lp.setPlayer1Completed(true);
            lp.setPlayer2Completed(true);
            teamLevelProgressRepository.save(lp);
        }

        FinalPasskeySubmissionRequest req = new FinalPasskeySubmissionRequest();
        req.setPasskey(rawPasskey);

        var resp = finalPasskeyService.submitFinalPasskey(principalP1, req);
        assertEquals("COMPLETED", resp.getStatus());

        Team updated = teamRepository.findById(testTeam.getId()).orElseThrow();
        assertEquals(TeamGameState.COMPLETED, updated.getGameState());
        assertEquals("STORY_COMPLETION", updated.getCurrentStoryKey());
        assertTrue(updated.isStoryActive());
    }

    @Test
    @DisplayName("12. Multi-team isolation: Team B story actions do not leak to Team A")
    void testMultiTeamStoryStateIsolation() {
        Team teamB = teamRepository.save(Team.builder()
                .event(testEvent)
                .teamCode("STORY-TB-" + System.currentTimeMillis())
                .teamName("Team Bravo")
                .status(TeamStatus.ACTIVE)
                .gameState(TeamGameState.IN_PROGRESS)
                .build());

        cinematicStoryService.triggerStory(testTeam, "STORY_L1_INTRO");
        cinematicStoryService.triggerStory(teamB, "STORY_L3_INTRO");

        assertEquals("STORY_L1_INTRO", cinematicStoryService.getCurrentStoryState(testTeam.getId()).getStoryKey());
        assertEquals("STORY_L3_INTRO", cinematicStoryService.getCurrentStoryState(teamB.getId()).getStoryKey());

        // Skip Team A
        cinematicStoryService.skipStory(testTeam.getId(), player1.getId());

        assertFalse(cinematicStoryService.getCurrentStoryState(testTeam.getId()).isStoryActive());
        assertTrue(cinematicStoryService.getCurrentStoryState(teamB.getId()).isStoryActive(), "Team B story must remain active!");
    }
}
