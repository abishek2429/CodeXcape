package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.dto.admin.CreateEventRequest;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.dto.admin.UpdateEventRequest;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final AuditService auditService;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        validateTimestamps(request.getStartTime(), request.getEndTime());

        String rawPasskey = (request.getPasskey() != null && !request.getPasskey().isBlank())
                ? request.getPasskey()
                : generateRandomPasskey();

        // Standard passkey hash representation for Phase 3 storage
        String passkeyHash = "HASH_" + Integer.toHexString(rawPasskey.hashCode());

        Event event = Event.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .status(EventStatus.DRAFT)
                .passkeyHash(passkeyHash)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Event saved = eventRepository.save(event);
        auditService.logEvent(GameEventType.EVENT_CREATED, saved, null, null,
                "{\"name\":\"" + saved.getName() + "\"}");

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long eventId) {
        Event event = findEventOrThrow(eventId);
        return mapToResponse(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request) {
        validateTimestamps(request.getStartTime(), request.getEndTime());

        Event event = findEventOrThrow(eventId);
        event.setName(request.getName().trim());
        event.setDescription(request.getDescription());
        event.setStatus(request.getStatus());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());

        Event updated = eventRepository.save(event);
        auditService.logEvent(GameEventType.EVENT_UPDATED, updated, null, null,
                "{\"status\":\"" + updated.getStatus() + "\"}");

        return mapToResponse(updated);
    }

    @Transactional
    public EventResponse updateEventStatus(Long eventId, EventStatus status) {
        Event event = findEventOrThrow(eventId);
        event.setStatus(status);

        Event updated = eventRepository.save(event);
        auditService.logEvent(GameEventType.EVENT_STATUS_CHANGED, updated, null, null,
                "{\"newStatus\":\"" + status + "\"}");

        return mapToResponse(updated);
    }

    public Event findEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
    }

    private void validateTimestamps(Instant startTime, Instant endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("Event end time cannot be before start time");
        }
    }

    private String generateRandomPasskey() {
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private EventResponse mapToResponse(Event event) {
        long teamCount = teamRepository.countByEventId(event.getId());
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .status(event.getStatus())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .teamCount(teamCount)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
