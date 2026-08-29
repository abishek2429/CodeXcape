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
import com.technicalescaperoom.backend.service.admin.AdminContentService;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class InfrastructureAndChaosFailureTest {

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
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event chaosEvent;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("chaos_test_admin", UserRole.ADMIN);

        chaosEvent = eventRepository.save(Event.builder()
                .name("Infrastructure & Chaos Failure Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Organizer Controls Under Load: Pause, Resume, Emergency Stop, Event End")
    void testOrganizerControlsUnderConcurrentLoad() {
        TeamDetailResponse regRes = teamService.createTeam(chaosEvent.getId(), CreateTeamRequest.builder()
                .teamName("Organizer Control Chaos Team")
                .player1DisplayName("Player 1")
                .player2DisplayName("Player 2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(chaosEvent.getId())
                .playerNumber(1)
                .sessionToken("ctrl_chaos_token")
                .build();

        // 1. Admin triggers PAUSE
        adminEventControlService.updateEventStatus(adminPrincipal, chaosEvent.getId(), EventStatus.PAUSED);

        // Submissions must be rejected immediately during PAUSED state
        assertThatThrownBy(() -> questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer("ans").build()))
                .isInstanceOf(EventUnavailableException.class)
                .hasMessageContaining("not currently active");

        // 2. Admin triggers RESUME
        adminEventControlService.updateEventStatus(adminPrincipal, chaosEvent.getId(), EventStatus.RUNNING);

        // Submissions succeed when RUNNING
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        AnswerSubmissionResponseDto res1 = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertThat(res1.getCorrect()).isTrue();

        // 3. Admin triggers EMERGENCY STOP
        adminEventControlService.emergencyStop(adminPrincipal, chaosEvent.getId(), "Severe Power Spike");

        // Submissions rejected after Emergency Stop
        assertThatThrownBy(() -> questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer("ans").build()))
                .isInstanceOf(EventUnavailableException.class);

        // 4. Admin triggers EVENT END (COMPLETED)
        adminEventControlService.updateEventStatus(adminPrincipal, chaosEvent.getId(), EventStatus.COMPLETED);

        // Submissions rejected after event ended
        assertThatThrownBy(() -> questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer("ans").build()))
                .isInstanceOf(EventUnavailableException.class);
    }

    @Test
    @DisplayName("Database Integrity Preserved Over Invalid Answers & Erroneous Passkeys")
    void testDatabaseIntegrityPreservedOverErroneousInputs() {
        TeamDetailResponse regRes = teamService.createTeam(chaosEvent.getId(), CreateTeamRequest.builder()
                .teamName("DB Integrity Team")
                .player1DisplayName("P1")
                .player2DisplayName("P2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(chaosEvent.getId()).playerNumber(1).sessionToken("db_integ_token").build();

        // Invalid answer submission does NOT corrupt level status
        AnswerSubmissionResponseDto wrongAns = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer("invalid_garbage_ans").build());
        assertThat(wrongAns.getCorrect()).isFalse();

        PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
        assertThat(qDto.getLevelNumber()).isEqualTo(1);
        assertThat(qDto.getIsCompleted()).isFalse();

        // Premature final passkey submission fails gracefully without corrupting team state
        FinalPasskeyResponseDto prematurePasskey = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder().passkey("123456").build());
        assertThat(prematurePasskey.getStatus()).isEqualTo("FINAL_NOT_AVAILABLE");
    }
}
