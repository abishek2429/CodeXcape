package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.enums.WebSocketEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastToTeam(Long teamId, WebSocketEventDto event) {
        if (teamId == null || event == null) return;
        String destination = "/topic/team/" + teamId;
        publishEvent(destination, event);
        broadcastToAdmin(event);
    }

    public void broadcastToAdmin(WebSocketEventDto event) {
        if (event == null) return;
        publishEvent("/topic/admin", event);
    }

    private void publishEvent(String destination, WebSocketEventDto event) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.debug("Publishing WebSocket event {} to {} (after commit)", event.getType(), destination);
                    messagingTemplate.convertAndSend(destination, event);
                }
            });
        } else {
            log.debug("Publishing WebSocket event {} to {} (immediate)", event.getType(), destination);
            messagingTemplate.convertAndSend(destination, event);
        }
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
        notifyPartnerChallengeCompleted(teamId, levelNumber, null, completedPlayerNumber);
    }

    public void notifyPartnerChallengeCompleted(Long teamId, Integer levelNumber, Integer stageNumber, Integer completedPlayerNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.PARTNER_CHALLENGE_COMPLETED)
                .teamId(teamId)
                .levelNumber(levelNumber)
                .stageNumber(stageNumber)
                .playerNumber(completedPlayerNumber)
                .message("Your teammate (Player " + completedPlayerNumber + ") completed their challenge ✓")
                .timestamp(Instant.now())
                .serverTime(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyStageCompleted(Long teamId, Integer levelNumber, Integer stageNumber, Integer nextStageNumber) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.STAGE_COMPLETED)
                .teamId(teamId)
                .levelNumber(levelNumber)
                .stageNumber(stageNumber)
                .nextStageNumber(nextStageNumber)
                .message("Stage " + stageNumber + " completed by both players ✓")
                .timestamp(Instant.now())
                .serverTime(Instant.now())
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

    public void notifyRankChanged(Long teamId, Integer newRank) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.RANK_CHANGED)
                .teamId(teamId)
                .newRank(newRank)
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyTeamAntiCheatAlert(Long teamId, String teamCode, Integer playerNumber, String violationType,
                                         Integer penaltyPoints, Integer teamTotalPenalties, String message) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.ANTI_CHEAT_ALERT)
                .teamId(teamId)
                .teamCode(teamCode)
                .playerNumber(playerNumber)
                .violationType(violationType)
                .penaltyPoints(penaltyPoints)
                .teamTotalPenalties(teamTotalPenalties)
                .message(message)
                .timestamp(Instant.now())
                .build();
        broadcastToTeam(teamId, event);
    }

    public void notifyAdminAntiCheatEvent(Long teamId, String teamCode, Long playerId, Integer playerNumber,
                                          String displayName, String violationType, Integer penaltyPoints,
                                          Integer teamTotalPenalties, Integer totalViolations, String message) {
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type(WebSocketEventType.ANTI_CHEAT_EVENT)
                .teamId(teamId)
                .teamCode(teamCode)
                .playerId(playerId)
                .playerNumber(playerNumber)
                .displayName(displayName)
                .violationType(violationType)
                .penaltyPoints(penaltyPoints)
                .teamTotalPenalties(teamTotalPenalties)
                .totalViolations(totalViolations)
                .message(message)
                .timestamp(Instant.now())
                .build();
        broadcastToAdmin(event);
    }
}
