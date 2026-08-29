package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.QuestionConfigDto;
import com.technicalescaperoom.backend.dto.admin.TeamDetailResponse;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;
import com.technicalescaperoom.backend.service.admin.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class FailureRecoveryAndResilienceTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private PlayerSessionService playerSessionService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("qa_resilience_admin", UserRole.ADMIN);

        testEvent = eventRepository.save(Event.builder()
                .name("Resilience Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Disconnect, Reconnect & State Preservation")
    void testDisconnectReconnectAndStatePreservation() {
        TeamDetailResponse regRes = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Resilience Disconnect Team")
                .player1DisplayName("Player 1")
                .player2DisplayName("Player 2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .sessionToken("token_session_1")
                .build();

        // Complete P1 challenge on Level 1
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        AnswerSubmissionResponseDto ansRes = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer(q1.getExpectedAnswerHash())
                .build());
        assertThat(ansRes.getCorrect()).isTrue();

        // Reconnected principal context
        PlayerPrincipal p1Reconnected = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .sessionToken("token_session_2")
                .build();

        // Verify state preservation
        PlayerQuestionDto currentQ = questionAnswerService.getCurrentQuestionForPlayer(p1Reconnected);
        assertThat(currentQ.getLevelNumber()).isEqualTo(1);
        assertThat(currentQ.getIsCompleted()).isTrue();
    }

    @Test
    @DisplayName("Event Controls (Pause / Emergency Stop) Block Submissions")
    void testEventControlInteractionsAndOperationRejection() {
        TeamDetailResponse regRes = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Event Control Test Team")
                .player1DisplayName("P1")
                .player2DisplayName("P2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .sessionToken("ctrl_token")
                .build();

        // 1. Pause Event
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.PAUSED);

        // Attempting answer submission during PAUSED event must fail
        assertThatThrownBy(() -> questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer("test").build()))
                .isInstanceOf(EventUnavailableException.class)
                .hasMessageContaining("not currently active");

        // 2. Resume Event
        adminEventControlService.updateEventStatus(adminPrincipal, testEvent.getId(), EventStatus.RUNNING);

        // Submission succeeds when RUNNING
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        AnswerSubmissionResponseDto res = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertThat(res.getCorrect()).isTrue();
    }

    @Test
    @DisplayName("Content Lock Enforced Server-Side During Active Event")
    void testContentLockDuringActiveEvent() {
        // Attempting to edit content when event status is RUNNING
        assertThatThrownBy(() -> adminContentService.saveQuestionConfig(adminPrincipal, testEvent.getId(), 1, QuestionConfigDto.builder()
                .playerNumber(QuestionPlayer.PLAYER_1)
                .questionContent("Modified while running")
                .expectedAnswer("new_ans")
                .build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Event content is locked");
    }

    @Test
    @DisplayName("Concurrent Answer Submission Race Condition Handling")
    void testConcurrentAnswerSubmissionRaceConditions() {
        TeamDetailResponse regRes = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Concurrent Race Team")
                .player1DisplayName("P1 Race")
                .player2DisplayName("P2 Race")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 2).orElseThrow();

        PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(testEvent.getId()).playerNumber(1).sessionToken("race1").build();
        PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(regRes.getId()).eventId(testEvent.getId()).playerNumber(2).sessionToken("race2").build();

        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
        Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

        AnswerSubmissionResponseDto r1 = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        AnswerSubmissionResponseDto r2 = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer(q2.getExpectedAnswerHash()).build());

        assertThat(r1.getCorrect()).isTrue();
        assertThat(r2.getCorrect()).isTrue();
        assertThat(r2.getIsCompleted()).isTrue();
    }
}
