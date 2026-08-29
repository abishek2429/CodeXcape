package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.admin.CreateEventRequest;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.dto.admin.UpdateEventRequest;
import com.technicalescaperoom.backend.dto.admin.UpdateEventStatusRequest;
import com.technicalescaperoom.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody CreateEventRequest request) {
        EventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long eventId) {
        EventResponse response = eventService.getEventById(eventId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> listEvents() {
        List<EventResponse> response = eventService.getAllEvents();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        EventResponse response = eventService.updateEvent(eventId, request);
        return ResponseEntity.ok(response);
    }

    private final com.technicalescaperoom.backend.service.admin.AdminEventControlService adminEventControlService;
    private final com.technicalescaperoom.backend.service.admin.AdminDashboardService adminDashboardService;
    private final com.technicalescaperoom.backend.service.admin.AdminAuditService adminAuditService;

    @PatchMapping("/{eventId}/status")
    public ResponseEntity<EventResponse> updateEventStatus(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventStatusRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        EventResponse response = adminEventControlService.updateEventStatus(principal, eventId, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/start")
    public ResponseEntity<EventResponse> startEvent(
            @PathVariable Long eventId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        EventResponse response = adminEventControlService.updateEventStatus(principal, eventId, com.technicalescaperoom.backend.enums.EventStatus.RUNNING);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/pause")
    public ResponseEntity<EventResponse> pauseEvent(
            @PathVariable Long eventId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        EventResponse response = adminEventControlService.updateEventStatus(principal, eventId, com.technicalescaperoom.backend.enums.EventStatus.PAUSED);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/resume")
    public ResponseEntity<EventResponse> resumeEvent(
            @PathVariable Long eventId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        EventResponse response = adminEventControlService.updateEventStatus(principal, eventId, com.technicalescaperoom.backend.enums.EventStatus.RUNNING);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/end")
    public ResponseEntity<EventResponse> endEvent(
            @PathVariable Long eventId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        EventResponse response = adminEventControlService.updateEventStatus(principal, eventId, com.technicalescaperoom.backend.enums.EventStatus.COMPLETED);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{eventId}/passkey")
    public ResponseEntity<EventResponse> updatePasskey(
            @PathVariable Long eventId,
            @RequestBody java.util.Map<String, String> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        String passkey = body.get("passkey");
        EventResponse response = adminEventControlService.updateEventPasskey(principal, eventId, passkey);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}/dashboard")
    public ResponseEntity<com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto> getDashboardStats(@PathVariable Long eventId) {
        com.technicalescaperoom.backend.dto.admin.AdminDashboardResponseDto response = adminDashboardService.getDashboardStats(eventId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.technicalescaperoom.backend.entity.AdminAuditLog>> getAuditLogs() {
        List<com.technicalescaperoom.backend.entity.AdminAuditLog> logs = adminAuditService.getRecentAuditLogs();
        return ResponseEntity.ok(logs);
    }
}
