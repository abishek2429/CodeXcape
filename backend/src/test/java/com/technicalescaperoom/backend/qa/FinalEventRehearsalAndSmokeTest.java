package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class FinalEventRehearsalAndSmokeTest {

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
    private AdminContentService adminContentService;

    @Autowired
    private EventContentValidationService eventContentValidationService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private FinalPasskeyService finalPasskeyService;

    @Autowired
    private HintService hintService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private ResultExportService resultExportService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event rehearsalEvent;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("final_rehearsal_admin", UserRole.ADMIN);

        // 1. Create Production Rehearsal Event
        rehearsalEvent = eventRepository.save(Event.builder()
                .name("CodeXcape 2026 Final Event Rehearsal")
                .description("Production Live Rehearsal")
                .status(EventStatus.DRAFT)
                .passkeyHash("")
                .createdAt(Instant.now())
                .build());

        // 2. Configure 6-Digit Secret Passkey & Content
        adminEventControlService.updateEventPasskey(adminPrincipal, rehearsalEvent.getId(), "777888");

        for (int i = 1; i <= 6; i++) {
            adminContentService.saveQuestionConfig(adminPrincipal, rehearsalEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_1)
                    .evidence("Rehearsal Q L" + i + " P1")
                    .expectedAnswer("ans_l" + i + "_p1")
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveQuestionConfig(adminPrincipal, rehearsalEvent.getId(), i, QuestionConfigDto.builder()
                    .playerNumber(QuestionPlayer.PLAYER_2)
                    .evidence("Rehearsal Q L" + i + " P2")
                    .expectedAnswer("ans_l" + i + "_p2")
                    .answerType(AnswerType.TEXT)
                    .build());

            adminContentService.saveHintConfig(adminPrincipal, rehearsalEvent.getId(), i, HintConfigDto.builder()
                    .hintContent("Rehearsal Hint L" + i)
                    .displayOrder(1)
                    .build());
        }
    }

    @Test
    @DisplayName("Pre-Flight Content & System Freeze Validation")
    void testPreFlightContentValidation() {
        EventReadinessDto readiness = eventContentValidationService.validateEventReadiness(rehearsalEvent.getId());
        assertThat(readiness.isOverallReady()).isTrue();
        assertThat(readiness.getValidationErrors()).isEmpty();
        assertThat(readiness.getLevelSummaries()).hasSize(6);
    }

    @Test
    @DisplayName("Full End-to-End Dress Rehearsal Workflow")
    void testFullEndToEndDressRehearsalWorkflow() {
        // 1. Organizer Launches Event (DRAFT -> RUNNING)
        EventResponse startRes = adminEventControlService.updateEventStatus(adminPrincipal, rehearsalEvent.getId(), EventStatus.RUNNING);
        assertThat(startRes.getStatus()).isEqualTo(EventStatus.RUNNING);

        // 2. Register Test Team
        TeamDetailResponse teamRes = teamService.createTeam(rehearsalEvent.getId(), CreateTeamRequest.builder()
                .teamName("Rehearsal Champions")
                .player1DisplayName("Alice")
                .player2DisplayName("Bob")
                .build());

        assertThat(teamRes.getTeamCode()).startsWith("TEAM-");
        assertThat(teamRes.getPlayers()).hasSize(2);

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 1).orElseThrow();
        Player p2 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 2).orElseThrow();

        PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(teamRes.getId()).eventId(rehearsalEvent.getId()).playerNumber(1).sessionToken("reh_token_p1").build();
        PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(teamRes.getId()).eventId(rehearsalEvent.getId()).playerNumber(2).sessionToken("reh_token_p2").build();

        // 3. Complete Levels 1 through 6 Linear Progression
        for (int lvl = 1; lvl <= 6; lvl++) {
            // P1 question check & submission
            PlayerQuestionDto q1Dto = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
            assertThat(q1Dto.getLevelNumber()).isEqualTo(lvl);
            assertThat(q1Dto.toString()).doesNotContain("ans_l" + lvl);

            AnswerSubmissionResponseDto p1Sub = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(lvl).answer("ans_l" + lvl + "_p1").build());
            assertThat(p1Sub.getCorrect()).isTrue();

            // P2 question check & submission
            AnswerSubmissionResponseDto p2Sub = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder().levelNumber(lvl).answer("ans_l" + lvl + "_p2").build());
            assertThat(p2Sub.getCorrect()).isTrue();
            assertThat(p2Sub.getIsCompleted()).isTrue();

            // Hint check
            PlayerHintsResponseDto hintsDto = hintService.getHintsForPlayer(p1Princ);
            long unlocked = hintsDto.getHints().stream().filter(h -> Boolean.TRUE.equals(h.getIsUnlocked())).count();
            assertThat(unlocked).isEqualTo(lvl);
        }

        // 4. Final Terminal Passkey Validation Rehearsal
        // Incorrect Passkey Test
        FinalPasskeyResponseDto wrongPasskey = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder().passkey("000000").build());
        assertThat(wrongPasskey.getStatus()).isEqualTo("INCORRECT");

        // Correct Passkey Test
        FinalPasskeyResponseDto correctPasskey = finalPasskeyService.submitFinalPasskey(p1Princ, FinalPasskeySubmissionRequest.builder().passkey("777888").build());
        assertThat(correctPasskey.getStatus()).isEqualTo("COMPLETED");

        // 5. Leaderboard & Results CSV Export Check
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(rehearsalEvent.getId());
        assertThat(leaderboard).hasSize(1);
        assertThat(leaderboard.get(0).getTeamName()).isEqualTo("Rehearsal Champions");
        assertThat(leaderboard.get(0).getGameState()).isEqualTo(TeamGameState.COMPLETED);

        String csvText = resultExportService.generateEventResultsCsv(adminPrincipal, rehearsalEvent.getId());
        assertThat(csvText).contains("Rehearsal Champions");
        assertThat(csvText).contains("COMPLETED");
        // Confirm secret passkey hash is NEVER exposed in CSV
        assertThat(csvText).doesNotContain("777888");

        // 6. Admin Event End
        EventResponse endRes = adminEventControlService.updateEventStatus(adminPrincipal, rehearsalEvent.getId(), EventStatus.COMPLETED);
        assertThat(endRes.getStatus()).isEqualTo(EventStatus.COMPLETED);
    }
}
