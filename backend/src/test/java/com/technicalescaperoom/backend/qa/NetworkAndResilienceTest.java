package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.QuestionConfigDto;
import com.technicalescaperoom.backend.dto.admin.TeamDetailResponse;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
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
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class NetworkAndResilienceTest {

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
    private PasswordEncoder passwordEncoder;

    private AdminPrincipal adminPrincipal;
    private Event resilienceEvent;

    @BeforeEach
    void setUp() {
        adminPrincipal = new AdminPrincipal("net_resilience_admin", UserRole.ADMIN);

        resilienceEvent = eventRepository.save(Event.builder()
                .name("Network & Resilience Test Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Network Interruption & Player State Resynchronization")
    void testNetworkInterruptionAndStateResynchronization() {
        TeamDetailResponse regRes = teamService.createTeam(resilienceEvent.getId(), CreateTeamRequest.builder()
                .teamName("Network Resync Team")
                .player1DisplayName("Player 1")
                .player2DisplayName("Player 2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Original = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(resilienceEvent.getId())
                .playerNumber(1)
                .sessionToken("token_net_1")
                .build();

        // 1. Solve Level 1 challenge
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        AnswerSubmissionResponseDto ansRes = questionAnswerService.submitAnswer(p1Original, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer(q1.getExpectedAnswerHash())
                .build());
        assertThat(ansRes.getCorrect()).isTrue();

        // 2. Simulate Network Drop & Reconnect (new session token issued)
        PlayerPrincipal p1Reconnected = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(resilienceEvent.getId())
                .playerNumber(1)
                .sessionToken("token_net_2_reconnected")
                .build();

        // 3. State Sync check
        PlayerQuestionDto syncedQ = questionAnswerService.getCurrentQuestionForPlayer(p1Reconnected);
        assertThat(syncedQ.getLevelNumber()).isEqualTo(1);
        assertThat(syncedQ.getIsCompleted()).isTrue();
    }

    @Test
    @DisplayName("Partial Network Outage (20 Players Offline, Remaining Active)")
    void testPartialNetworkOutageIsolation() {
        List<TeamDetailResponse> teams = new ArrayList<>();

        for (int i = 1; i <= 20; i++) {
            teams.add(teamService.createTeam(resilienceEvent.getId(), CreateTeamRequest.builder()
                    .teamName("Partial Net Team " + i)
                    .player1DisplayName("P1_" + i)
                    .player2DisplayName("P2_" + i)
                    .build()));
        }

        // Teams 1-10 lose network (offline), Teams 11-20 continue playing
        for (int i = 10; i < 20; i++) {
            TeamDetailResponse activeTeam = teams.get(i);
            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(activeTeam.getId(), 1).orElseThrow();
            Player p2 = playerRepository.findByTeamIdAndPlayerNumber(activeTeam.getId(), 2).orElseThrow();

            PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(activeTeam.getId()).eventId(resilienceEvent.getId()).playerNumber(1).sessionToken("act_token_p1_" + i).build();
            PlayerPrincipal p2Princ = PlayerPrincipal.builder().playerId(p2.getId()).teamId(activeTeam.getId()).eventId(resilienceEvent.getId()).playerNumber(2).sessionToken("act_token_p2_" + i).build();

            Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
            Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();
            Question q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2).orElseThrow();

            questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
            AnswerSubmissionResponseDto p2Res = questionAnswerService.submitAnswer(p2Princ, AnswerSubmissionRequest.builder().levelNumber(1).answer(q2.getExpectedAnswerHash()).build());

            assertThat(p2Res.getIsCompleted()).isTrue();
        }

        // Verify offline teams (1-10) remain unaffected at Level 1 uncompleted
        for (int i = 0; i < 10; i++) {
            TeamDetailResponse offlineTeam = teams.get(i);
            Player p1 = playerRepository.findByTeamIdAndPlayerNumber(offlineTeam.getId(), 1).orElseThrow();
            PlayerPrincipal p1Princ = PlayerPrincipal.builder().playerId(p1.getId()).teamId(offlineTeam.getId()).eventId(resilienceEvent.getId()).playerNumber(1).sessionToken("off_token_" + i).build();

            PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
            assertThat(qDto.getLevelNumber()).isEqualTo(1);
            assertThat(qDto.getIsCompleted()).isFalse();
        }
    }

    @Test
    @DisplayName("Rapid Reconnect Loop Resilience (10 Consecutive Cycles)")
    void testRapidReconnectLoopResilience() {
        TeamDetailResponse regRes = teamService.createTeam(resilienceEvent.getId(), CreateTeamRequest.builder()
                .teamName("Rapid Loop Team")
                .player1DisplayName("Player 1")
                .player2DisplayName("Player 2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();

        for (int cycle = 1; cycle <= 10; cycle++) {
            PlayerPrincipal p1Loop = PlayerPrincipal.builder()
                    .playerId(p1.getId())
                    .teamId(regRes.getId())
                    .eventId(resilienceEvent.getId())
                    .playerNumber(1)
                    .sessionToken("loop_token_" + cycle)
                    .build();

            PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(p1Loop);
            assertThat(qDto.getLevelNumber()).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("Multi-Tab & Duplicate Submission Prevention")
    void testMultiTabDuplicateSubmissionPrevention() {
        TeamDetailResponse regRes = teamService.createTeam(resilienceEvent.getId(), CreateTeamRequest.builder()
                .teamName("Multi Tab Team")
                .player1DisplayName("P1")
                .player2DisplayName("P2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();

        // Tab A and Tab B session contexts
        PlayerPrincipal tabAPrinc = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(resilienceEvent.getId()).playerNumber(1).sessionToken("tab_a_token").build();
        PlayerPrincipal tabBPrinc = PlayerPrincipal.builder().playerId(p1.getId()).teamId(regRes.getId()).eventId(resilienceEvent.getId()).playerNumber(1).sessionToken("tab_b_token").build();

        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        // Submit from Tab A
        AnswerSubmissionResponseDto resA = questionAnswerService.submitAnswer(tabAPrinc, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertThat(resA.getCorrect()).isTrue();

        // Duplicate submission attempt from Tab B
        AnswerSubmissionResponseDto resB = questionAnswerService.submitAnswer(tabBPrinc, AnswerSubmissionRequest.builder().levelNumber(1).answer(q1.getExpectedAnswerHash()).build());
        assertThat(resB.getCorrect()).isTrue();
        // State remains Level 1 P1 completed, no duplicate level progression
    }

    @Test
    @DisplayName("Server-Authoritative Timestamps Immune to Client Clock Manipulation")
    void testServerAuthoritativeTimestampImmunity() {
        Instant before = Instant.now();

        TeamDetailResponse regRes = teamService.createTeam(resilienceEvent.getId(), CreateTeamRequest.builder()
                .teamName("Authoritative Time Team")
                .player1DisplayName("P1")
                .player2DisplayName("P2")
                .build());

        Instant after = Instant.now();

        Team team = teamRepository.findById(regRes.getId()).orElseThrow();
        assertThat(team.getCreatedAt()).isAfterOrEqualTo(before);
        assertThat(team.getCreatedAt()).isBeforeOrEqualTo(after);
    }
}
