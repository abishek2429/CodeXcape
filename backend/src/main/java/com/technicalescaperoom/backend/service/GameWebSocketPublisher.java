package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.enums.WebSocketEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastToTeam(Long teamId, WebSocketEventDto event) {
        if (teamId == null || event == null) return;
        String destination = "/topic/team/" + teamId;
        log.debug("Publishing WebSocket event {} to {}", event.getType(), destination);
        messagingTemplate.convertAndSend(destination, event);
    }

    public void notifyPlayerConnection(Long teamId, Long playerId, Integer playerNumber, String displayName, boolean connected) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(connected ? WebSocketEventType.PLAYER_CONNECTED : WebSocketEventType.PLAYER_DISCONNECTED)
                .teamId(teamId)
                .playerId(playerId)
                .playerNumber(playerNumber)
                .displayName(displayName)
                .message(connected ? "Player " + playerNumber + " connected." : "Player " + playerNumber + " disconnected.")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyPartnerChallengeCompleted(Long teamId, Integer levelNumber, Integer completedPlayerNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.PARTNER_CHALLENGE_COMPLETED)
                .teamId(teamId)
                .levelNumber(levelNumber)
                .playerNumber(completedPlayerNumber)
                .message("Your teammate (Player " + completedPlayerNumber + ") completed their challenge ✓")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyLevelCompleted(Long teamId, Integer levelNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.LEVEL_COMPLETED)
                .teamId(teamId)
                .levelNumber(levelNumber)
                .message("Level " + levelNumber + " completed by both players ✓")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyNextLevelUnlocked(Long teamId, Integer nextLevelNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.NEXT_LEVEL_UNLOCKED)
                .teamId(teamId)
                .nextLevelNumber(nextLevelNumber)
                .message("Level " + nextLevelNumber + " is now unlocked!")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyHintUnlocked(Long teamId, Integer levelNumber, Integer hintNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.HINT_UNLOCKED)
                .teamId(teamId)
                .levelNumber(levelNumber)
                .message("Hint " + hintNumber + " unlocked!")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyGameCompleted(Long teamId) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.GAME_COMPLETED)
                .teamId(teamId)
                .message("CODEXCAPE COMPLETED! Your team successfully escaped!")
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyEventStatusChange(Long teamId, String message) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.GAME_STATE_UPDATED)
                .teamId(teamId)
                .message(message)
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }
}
