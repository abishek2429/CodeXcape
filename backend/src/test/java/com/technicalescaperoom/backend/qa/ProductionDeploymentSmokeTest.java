package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.controller.HealthController;
import com.technicalescaperoom.backend.dto.HealthResponseDto;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.TeamDetailResponse;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.*;

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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class ProductionDeploymentSmokeTest {

    @Autowired
    private HealthController healthController;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamService teamService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event smokeEvent;

    @BeforeEach
    void setUp() {
        smokeEvent = eventRepository.save(Event.builder()
                .name("Production Deployment Smoke Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("999999"))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Production Health Check API Endpoint Verification (/api/health)")
    void testProductionHealthCheckEndpoint() {
        ResponseEntity<HealthResponseDto> response = healthController.getHealth();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        HealthResponseDto health = response.getBody();
        assertThat(health).isNotNull();
        assertThat(health.getStatus()).isEqualTo("UP");
        assertThat(health.getDatabase()).isEqualTo("UP");
        assertThat(health.getService()).isEqualTo("technical-escape-room-backend");
    }

    @Test
    @DisplayName("Production Deployment E2E Smoke Flow")
    void testProductionDeploymentE2ESmokeFlow() {
        // 1. Team & Player Registration Smoke Check
        TeamDetailResponse teamRes = teamService.createTeam(smokeEvent.getId(), CreateTeamRequest.builder()
                .teamName("Smoke Test Team")
                .player1DisplayName("Smoke P1")
                .player2DisplayName("Smoke P2")
                .build());

        assertThat(teamRes.getTeamCode()).startsWith("TEAM-");
        assertThat(teamRes.getPlayers()).hasSize(2);

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(teamRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(teamRes.getId())
                .eventId(smokeEvent.getId())
                .playerNumber(1)
                .sessionToken("smoke_token_p1")
                .build();

        // 2. Question Retrieval Smoke Check
        PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
        assertThat(qDto.getLevelNumber()).isEqualTo(1);
        assertThat(qDto.getQuestionContent()).isNotEmpty();
        assertThat(qDto.toString()).doesNotContain("expectedAnswer");

        // 3. Answer Submission Smoke Check
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();
        Question q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1).orElseThrow();

        AnswerSubmissionResponseDto ansRes = questionAnswerService.submitAnswer(p1Princ, AnswerSubmissionRequest.builder()
                .levelNumber(1)
                .answer(q1.getExpectedAnswerHash())
                .build());

        assertThat(ansRes.getCorrect()).isTrue();
    }
}
