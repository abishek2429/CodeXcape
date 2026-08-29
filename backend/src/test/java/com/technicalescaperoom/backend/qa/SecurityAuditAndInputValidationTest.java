package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.TeamDetailResponse;
import com.technicalescaperoom.backend.dto.player.*;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
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
public class SecurityAuditAndInputValidationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamService teamService;

    @Autowired
    private QuestionAnswerService questionAnswerService;

    @Autowired
    private AdminEventControlService adminEventControlService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Event testEvent;

    @BeforeEach
    void setUp() {
        testEvent = eventRepository.save(Event.builder()
                .name("Security Audit Event")
                .status(EventStatus.RUNNING)
                .passkeyHash(passwordEncoder.encode("123456"))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Cross-Team Isolation & Unauthorized Access Prevention")
    void testUnauthorizedCrossTeamAccess() {
        // Create Team A
        TeamDetailResponse teamA = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Team Alpha Security")
                .player1DisplayName("Alice A")
                .player2DisplayName("Bob A")
                .build());

        // Create Team B
        TeamDetailResponse teamB = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Team Beta Security")
                .player1DisplayName("Alice B")
                .player2DisplayName("Bob B")
                .build());

        Player p1A = playerRepository.findByTeamIdAndPlayerNumber(teamA.getId(), 1).orElseThrow();

        // Forged principal with Team A player ID but Team B team ID
        PlayerPrincipal forgedPrincipal = PlayerPrincipal.builder()
                .playerId(p1A.getId())
                .teamId(teamB.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .sessionToken("forged_token")
                .build();

        // Should throw ResourceNotFoundException due to team-player mismatch
        assertThatThrownBy(() -> questionAnswerService.getCurrentQuestionForPlayer(forgedPrincipal))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Player does not belong to the specified team.");
    }

    @Test
    @DisplayName("Input Validation & Sanitization (SQL Injection / Script Tags)")
    void testMaliciousInputValidationAndSanitization() {
        String sqlInjectionInput = "Team' OR '1'='1'; DROP TABLE teams; --";
        String scriptTagInput = "<script>alert('xss')</script>";

        TeamDetailResponse regRes = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName(sqlInjectionInput)
                .player1DisplayName(scriptTagInput)
                .player2DisplayName("Normal Player")
                .build());

        assertThat(regRes.getId()).isNotNull();

        Team loadedTeam = teamRepository.findById(regRes.getId()).orElseThrow();
        assertThat(loadedTeam.getTeamName()).isEqualTo(sqlInjectionInput); // Stored safely via JPA parameterized query
    }

    @Test
    @DisplayName("Zero Exposure of Expected Answers and Passkeys in Player DTOs")
    void testZeroPasskeyAndAnswerExposureInDTOs() {
        TeamDetailResponse regRes = teamService.createTeam(testEvent.getId(), CreateTeamRequest.builder()
                .teamName("Zero Leakage Team")
                .player1DisplayName("Leak P1")
                .player2DisplayName("Leak P2")
                .build());

        Player p1 = playerRepository.findByTeamIdAndPlayerNumber(regRes.getId(), 1).orElseThrow();
        PlayerPrincipal p1Princ = PlayerPrincipal.builder()
                .playerId(p1.getId())
                .teamId(regRes.getId())
                .eventId(testEvent.getId())
                .playerNumber(1)
                .sessionToken("zero_leak_token")
                .build();

        PlayerQuestionDto qDto = questionAnswerService.getCurrentQuestionForPlayer(p1Princ);
        assertThat(qDto.getQuestionContent()).isNotEmpty();
        // Verify PlayerQuestionDto fields contain NO expected answer fields or passkey fields
        assertThat(qDto.toString()).doesNotContain("expectedAnswer");
        assertThat(qDto.toString()).doesNotContain("passkey");
    }

    @Test
    @DisplayName("Role-Based Access Control on Admin Endpoints")
    void testRoleBasedAccessControlOnAdminEndpoints() {
        AdminPrincipal organizerPrinc = new AdminPrincipal("org1", UserRole.ORGANIZER);

        // Organizer updating event passkey succeeds
        adminEventControlService.updateEventPasskey(organizerPrinc, testEvent.getId(), "654321");

        // Player role attempting admin action throws AccessDeniedException
        AdminPrincipal playerPrinc = new AdminPrincipal("player1", UserRole.PLAYER);
        assertThatThrownBy(() -> adminEventControlService.updateEventPasskey(playerPrinc, testEvent.getId(), "111111"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Unauthorized administrative access");
    }
}
