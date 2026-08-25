package com.technicalescaperoom.backend.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.UpdateTeamRequest;
import com.technicalescaperoom.backend.dto.admin.UpdateTeamStatusRequest;
import com.technicalescaperoom.backend.enums.TeamStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class AdminTeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Create team in event with auto-generated unique team code")
    void testCreateTeamWithGeneratedCode() throws Exception {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("Binary Blitzers")
                .player1DisplayName("Alice")
                .player2DisplayName("Bob")
                .build();

        mockMvc.perform(post("/api/admin/events/1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.teamCode", startsWith("TEAM-")))
                .andExpect(jsonPath("$.teamName", is("Binary Blitzers")))
                .andExpect(jsonPath("$.status", is("REGISTERED")))
                .andExpect(jsonPath("$.players", hasSize(2)))
                .andExpect(jsonPath("$.players[0].playerNumber", is(1)))
                .andExpect(jsonPath("$.players[0].displayName", is("Alice")))
                .andExpect(jsonPath("$.players[1].playerNumber", is(2)))
                .andExpect(jsonPath("$.players[1].displayName", is("Bob")));
    }

    @Test
    @DisplayName("Create team with custom team code")
    void testCreateTeamWithCustomCode() throws Exception {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("Quantum Hackers")
                .player1DisplayName("Charlie")
                .player2DisplayName("Delta")
                .customTeamCode("TEAM-Q99")
                .build();

        mockMvc.perform(post("/api/admin/events/1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.teamCode", is("TEAM-Q99")));
    }

    @Test
    @DisplayName("Reject duplicate team code for same event")
    void testRejectDuplicateTeamCode() throws Exception {
        CreateTeamRequest request = CreateTeamRequest.builder()
                .teamName("Duplicate Team")
                .player1DisplayName("Echo")
                .player2DisplayName("Foxtrot")
                .customTeamCode("TEAM-001") // Existing team code in seed data
                .build();

        mockMvc.perform(post("/api/admin/events/1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Get team by ID via GET /api/admin/teams/{teamId}")
    void testGetTeamById() throws Exception {
        mockMvc.perform(get("/api/admin/teams/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.teamCode", is("TEAM-001")))
                .andExpect(jsonPath("$.players", hasSize(2)));
    }

    @Test
    @DisplayName("List teams for event via GET /api/admin/events/{eventId}/teams")
    void testListTeamsForEvent() throws Exception {
        mockMvc.perform(get("/api/admin/events/1/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].player1DisplayName", notNullValue()))
                .andExpect(jsonPath("$[0].player2DisplayName", notNullValue()));
    }

    @Test
    @DisplayName("Update team via PUT /api/admin/teams/{teamId}")
    void testUpdateTeam() throws Exception {
        UpdateTeamRequest request = UpdateTeamRequest.builder()
                .teamName("Renamed CyberKnights")
                .status(TeamStatus.ACTIVE)
                .player1DisplayName("Player 1 Renamed")
                .player2DisplayName("Player 2 Renamed")
                .build();

        mockMvc.perform(put("/api/admin/teams/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamName", is("Renamed CyberKnights")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.players[0].displayName", is("Player 1 Renamed")));
    }

    @Test
    @DisplayName("Update team status via PATCH /api/admin/teams/{teamId}/status")
    void testUpdateTeamStatus() throws Exception {
        UpdateTeamStatusRequest request = UpdateTeamStatusRequest.builder()
                .status(TeamStatus.ACTIVE)
                .build();

        mockMvc.perform(patch("/api/admin/teams/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("Delete team via DELETE /api/admin/teams/{teamId}")
    void testDeleteTeam() throws Exception {
        mockMvc.perform(delete("/api/admin/teams/1"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/teams/1"))
                .andExpect(status().isNotFound());
    }
}
