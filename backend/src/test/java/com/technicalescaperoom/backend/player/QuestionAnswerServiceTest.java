package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
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
public class QuestionAnswerServiceTest {

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private GameStateService gameStateService;

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
    private AnswerAttemptRepository answerAttemptRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    private Event activeEvent;
    private Team teamA;
    private Team teamB;
    private Player playerA1;
    private Player playerA2;
    private Player playerB1;
    private Level level1;
    private Question qA1;
    private Question qA2;

    @BeforeEach
    void setUp() {
        gameSessionRepository.deleteAll();
        answerAttemptRepository.deleteAll();

        // 1. Create Active Event
        activeEvent = eventRepository.save(Event.builder()
                .name("QA Engine Test Event 2026")
                .description("Test Event")
                .status(EventStatus.READY)
                .passkeyHash("passkeyHash")
                .build());

        // 2. Ensure Level 1 exists with Player 1 and Player 2 questions
        level1 = levelRepository.findByLevelNumber(1).orElseGet(() -> levelRepository.save(Level.builder()
                .levelNumber(1)
                .name("Level 1: System Breaker")
                .description("Crack authentication module")
                .difficulty("EASY")
                .isActive(true)
                .build()));

        qA1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .playerNumber(QuestionPlayer.PLAYER_1)
                        .evidence("Find the open SSH port integer on node 192.168.1.10.")
                        .expectedAnswerHash("22")
                        .answerType(AnswerType.NUMERIC)
                        .isActive(true)
                        .build()));

        qA2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2)
                .orElseGet(() -> questionRepository.save(Question.builder()
                        .level(level1)
                        .playerNumber(QuestionPlayer.PLAYER_2)
                        .evidence("Convert hexadecimal string 0x4142 to ASCII characters.")
                        .expectedAnswerHash("AB")
                        .answerType(AnswerType.TEXT)
                        .isActive(true)
                        .build()));

        // 3. Create Team A & Team B
        teamA = teamRepository.save(Team.builder()
                .event(activeEvent)
                .teamCode("TEAM-QA-01")
                .teamName("QA Alpha")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerA1 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(1)
                .displayName("Player A1")
                .status(PlayerStatus.INACTIVE)
                .build());

        playerA2 = playerRepository.save(Player.builder()
                .team(teamA)
                .playerNumber(2)
                .displayName("Player A2")
                .status(PlayerStatus.INACTIVE)
                .build());

        teamB = teamRepository.save(Team.builder()
                .event(activeEvent)
                .teamCode("TEAM-QA-02")
                .teamName("QA Beta")
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        playerB1 = playerRepository.save(Player.builder()
                .team(teamB)
                .playerNumber(1)
                .displayName("Player B1")
                .status(PlayerStatus.INACTIVE)
                .build());

        // Initialize game states
        gameStateService.initializeTeamGameState(teamA);
        gameStateService.initializeTeamGameState(teamB);
    }

    @Test
    @DisplayName("1. Player 1 gets Player 1 question; Player 2 gets Player 2 question for current level")
    void testRoleSpecificQuestionRetrieval() {
        PlayerQuestionDto qDtoP1 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        assertNotNull(qDtoP1);
        assertEquals(1, qDtoP1.getLevelNumber());
        assertTrue(qDtoP1.getEvidence().contains("SSH port"));

        PlayerQuestionDto qDtoP2 = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA2, teamA));
        assertNotNull(qDtoP2);
        assertEquals(1, qDtoP2.getLevelNumber());
        assertTrue(qDtoP2.getEvidence().contains("hexadecimal"));
    }

    @Test
    @DisplayName("2. Security: Question response never exposes expected answer or security details")
    void testQuestionResponseNoSensitiveData() {
        PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        assertNotNull(qDto.getEvidence());
        assertFalse(qDto.getEvidence().contains("22"));
    }

    @Test
    @DisplayName("3. Cross-Team Isolation: Team A completing question does not affect Team B status")
    void testCrossTeamQuestionIsolation() {
        // Team A submits correct answer
        AnswerSubmissionRequest correctReq = AnswerSubmissionRequest.builder().answer("22").build();
        questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), correctReq);

        // Verify Team A is completed
        PlayerQuestionDto qA = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        assertTrue(qA.getIsCompleted());

        // Verify Team B remains INCOMPLETE with 0 attempts
        PlayerQuestionDto qB = questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerB1, teamB));
        assertFalse(qB.getIsCompleted());
        assertEquals(0, qB.getAttemptCount());
    }

    @Test
    @DisplayName("4. Incorrect answer submission records attempt #1 as incorrect and leaves challenge incomplete")
    void testIncorrectAnswerSubmission() {
        AnswerSubmissionRequest request = AnswerSubmissionRequest.builder().answer("9999").build();

        AnswerSubmissionResponseDto response = questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), request);

        assertFalse(response.getCorrect());
        assertFalse(response.getIsCompleted());

        List<AnswerAttempt> attempts = answerAttemptRepository.findByTeamIdAndPlayerIdAndLevelId(teamA.getId(), playerA1.getId(), level1.getId());
        assertEquals(1, attempts.size());
        assertEquals(1, attempts.get(0).getAttemptNumber());
        assertFalse(attempts.get(0).getIsCorrect());
    }

    @Test
    @DisplayName("5. Correct answer submission updates player challenge completion and records attempt counter")
    void testCorrectAnswerSubmission() {
        // Attempt 1: Wrong answer
        AnswerSubmissionRequest wrongReq = AnswerSubmissionRequest.builder().answer("123").build();
        questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), wrongReq);

        // Attempt 2: Correct answer ("22")
        AnswerSubmissionRequest correctReq = AnswerSubmissionRequest.builder().answer(" 22 ").build();
        AnswerSubmissionResponseDto response = questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), correctReq);

        assertTrue(response.getCorrect());
        assertTrue(response.getIsCompleted());

        List<AnswerAttempt> attempts = answerAttemptRepository.findByTeamIdAndPlayerIdAndLevelId(teamA.getId(), playerA1.getId(), level1.getId());
        assertEquals(2, attempts.size());
        assertEquals(2, attempts.get(1).getAttemptNumber());
        assertTrue(attempts.get(1).getIsCorrect());

        TeamLevelProgress progress = teamLevelProgressRepository.findByTeamIdAndLevelId(teamA.getId(), level1.getId()).orElseThrow();
        assertTrue(progress.getPlayer1Completed());
        assertFalse(progress.getPlayer2Completed());
    }

    @Test
    @DisplayName("6. Repeated correct submission is idempotent and does not create duplicate attempts")
    void testRepeatedSubmissionIdempotency() {
        AnswerSubmissionRequest correctReq = AnswerSubmissionRequest.builder().answer("22").build();
        questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), correctReq);

        // Submit correct answer again
        AnswerSubmissionResponseDto res2 = questionAnswerService.submitAnswer(createPrincipal(playerA1, teamA), correctReq);

        assertTrue(res2.getCorrect());
        assertTrue(res2.getIsCompleted());

        List<AnswerAttempt> attempts = answerAttemptRepository.findByTeamIdAndPlayerIdAndLevelId(teamA.getId(), playerA1.getId(), level1.getId());
        assertEquals(1, attempts.size());
    }

    @Test
    @DisplayName("7. Event state restrictions: blocked when event is DRAFT")
    void testEventStateRestrictions() {
        activeEvent.setStatus(EventStatus.DRAFT);
        eventRepository.save(activeEvent);

        assertThrows(EventUnavailableException.class, () -> {
            questionAnswerService.getCurrentQuestionForPlayer(createPrincipal(playerA1, teamA));
        });
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
                .sessionToken("test-token-qa-" + player.getId())
                .build();
    }
}
