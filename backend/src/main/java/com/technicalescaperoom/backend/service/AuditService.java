package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.GameEvent;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.repository.GameEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final GameEventRepository gameEventRepository;

    public void logEvent(GameEventType eventType, Event event, Team team, Player player, String detailsJson) {
        GameEvent gameEvent = GameEvent.builder()
                .eventType(eventType)
                .event(event)
                .team(team)
                .player(player)
                .detailsJson(detailsJson)
                .source("ADMIN")
                .build();
        gameEventRepository.save(gameEvent);
    }
}
