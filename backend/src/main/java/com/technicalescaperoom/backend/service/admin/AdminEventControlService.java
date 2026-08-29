package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.dto.admin.EventResponse;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameWebSocketPublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminEventControlService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final GameWebSocketPublisher webSocketPublisher;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuditService adminAuditService;

    @Transactional
    public EventResponse updateEventStatus(AdminPrincipal principal, Long eventId, EventStatus newStatus) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        EventStatus oldStatus = event.getStatus();
        event.setStatus(newStatus);
        Event saved = eventRepository.save(event);

        log.info("Admin {} changed Event {} status from {} to {}",
                principal != null ? principal.getUsername() : "SYSTEM", eventId, oldStatus, newStatus);

        adminAuditService.logAction(
                principal,
                "UPDATE_EVENT_STATUS",
                "Event #" + eventId,
                "Changed status from " + oldStatus + " to " + newStatus
        );

        // Notify active teams via WebSocket
        List<Team> teams = teamRepository.findByEventId(eventId);
        String notificationMessage = switch (newStatus) {
            case PAUSED -> "CODEXCAPE IS PAUSED. Please wait for the organizer.";
            case RUNNING -> "CODEXCAPE RESUMED. Continue your challenge.";
            case COMPLETED -> "CODEXCAPE HAS ENDED. Gameplay is now closed.";
            default -> "Event status updated to " + newStatus;
        };

        for (Team team : teams) {
            webSocketPublisher.notifyEventStatusChange(team.getId(), notificationMessage);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public EventResponse updateEventPasskey(AdminPrincipal principal, Long eventId, String newPasskey) {
        if (newPasskey == null || newPasskey.isBlank()) {
            throw new IllegalArgumentException("Passkey cannot be blank.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found for ID " + eventId));

        String hashedPasskey = passwordEncoder.encode(newPasskey.trim());
        event.setPasskeyHash(hashedPasskey);
        Event saved = eventRepository.save(event);

        adminAuditService.logAction(
                principal,
                "CHANGE_FINAL_PASSKEY",
                "Event #" + eventId,
                "Updated final passkey hash"
        );

        log.info("Admin {} updated final passkey hash for Event #{}", principal != null ? principal.getUsername() : "SYSTEM", eventId);
        return mapToResponse(saved);
    }

    private EventResponse mapToResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
