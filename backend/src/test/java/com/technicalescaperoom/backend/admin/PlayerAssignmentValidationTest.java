package com.technicalescaperoom.backend.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.TeamService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class PlayerAssignmentValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamService teamService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    @DisplayName("Verify created team has exactly two players with playerNumber 1 and 2")
    void testTeamHasExactTwoPlayers() {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("ExactTwo Squad")
                .player1DisplayName("Player One")
                .player2DisplayName("Player Two")
                .build();

        var teamDetail = teamService.createTeam(1L, request);

        List<Player> players = playerRepository.findByTeamId(teamDetail.getId());
        assertThat(players).hasSize(2);
        assertThat(players).extracting(Player::getPlayerNumber).containsExactlyInAnyOrder(1, 2);
    }

    @Test
    @DisplayName("Reject team creation when player 1 name is missing")
    void testRejectMissingPlayer1() throws Exception {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("Incomplete Team")
                .player1DisplayName("")
                .player2DisplayName("Valid Player 2")
                .build();

        mockMvc.perform(post("/api/admin/events/1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Reject team creation when player 2 name is missing")
    void testRejectMissingPlayer2() throws Exception {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("Incomplete Team")
                .player1DisplayName("Valid Player 1")
                .player2DisplayName("")
                .build();

        mockMvc.perform(post("/api/admin/events/1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Database rejects attempt to add duplicate player number")
    void testDatabaseRejectsDuplicatePlayerNumber() {
        Team devTeam = teamRepository.findByTeamCode("TEAM-001").orElseThrow();

        assertThatThrownBy(() -> {
            playerRepository.saveAndFlush(Player.builder()
                    .team(devTeam)
                    .playerNumber(1)
                    .displayName("Illegal Duplicate Player 1")
                    .status(PlayerStatus.INACTIVE)
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Database rejects attempt to add player number 3")
    void testDatabaseRejectsPlayerNumberThree() {
        Team devTeam = teamRepository.findByTeamCode("TEAM-001").orElseThrow();

        assertThatThrownBy(() -> {
            playerRepository.saveAndFlush(Player.builder()
                    .team(devTeam)
                    .playerNumber(3)
                    .displayName("Illegal Player 3")
                    .status(PlayerStatus.INACTIVE)
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
