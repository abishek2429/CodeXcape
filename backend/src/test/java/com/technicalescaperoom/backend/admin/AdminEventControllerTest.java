package com.technicalescaperoom.backend.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.dto.admin.CreateEventRequest;
import com.technicalescaperoom.backend.dto.admin.UpdateEventRequest;
import com.technicalescaperoom.backend.dto.admin.UpdateEventStatusRequest;
import com.technicalescaperoom.backend.enums.EventStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class AdminEventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Create event successfully via POST /api/admin/events")
    void testCreateEventSuccess() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Hackathon Escape 2026")
                .description("Annual coding challenge escape room")
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(7200))
                .passkey("SECRET123")
                .build();

        mockMvc.perform(post("/api/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Hackathon Escape 2026")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.teamCount", is(0)));
    }

    @Test
    @DisplayName("Reject event creation with blank name")
    void testCreateEventBlankName() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("")
                .description("Invalid event")
                .build();

        mockMvc.perform(post("/api/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors.name", notNullValue()));
    }

    @Test
    @DisplayName("Reject event creation with invalid end time before start time")
    void testCreateEventInvalidTimestamps() throws Exception {
        Instant now = Instant.now();
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Bad Timestamps Event")
                .startTime(now)
                .endTime(now.minusSeconds(3600))
                .build();

        mockMvc.perform(post("/api/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be before start time")));
    }

    @Test
    @DisplayName("Get event by ID via GET /api/admin/events/{eventId}")
    void testGetEventById() throws Exception {
        mockMvc.perform(get("/api/admin/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", containsString("College Technical Fest")));
    }

    @Test
    @DisplayName("List all events via GET /api/admin/events")
    void testListEvents() throws Exception {
        mockMvc.perform(get("/api/admin/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Update event details via PUT /api/admin/events/{eventId}")
    void testUpdateEvent() throws Exception {
        UpdateEventRequest request = UpdateEventRequest.builder()
                .name("Updated Fest Escape 2026")
                .description("Updated description")
                .status(EventStatus.READY)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .build();

        mockMvc.perform(put("/api/admin/events/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Fest Escape 2026")))
                .andExpect(jsonPath("$.status", is("READY")));
    }

    @Test
    @DisplayName("Update event status via PATCH /api/admin/events/{eventId}/status")
    void testUpdateEventStatus() throws Exception {
        UpdateEventStatusRequest request = UpdateEventStatusRequest.builder()
                .status(EventStatus.RUNNING)
                .build();

        mockMvc.perform(patch("/api/admin/events/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RUNNING")));
    }
}
