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

    @PatchMapping("/{eventId}/status")
    public ResponseEntity<EventResponse> updateEventStatus(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventStatusRequest request) {
        EventResponse response = eventService.updateEventStatus(eventId, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
