package com.technicalescaperoom.backend.config.websocket;

import com.technicalescaperoom.backend.config.security.PlayerAuthenticationToken;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.service.GameWebSocketPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final GameWebSocketPublisher webSocketPublisher;
    private final WebSocketSessionRegistry sessionRegistry;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        if (headerAccessor.getUser() instanceof PlayerAuthenticationToken auth && auth.getPrincipal() instanceof PlayerPrincipal principal) {
            boolean isFirstConnection = sessionRegistry.registerPlayerSession(principal.getPlayerId(), sessionId);
            log.info("Player {} (P{}) connected STOMP session {} (first={}) for Team {}",
                    principal.getPlayerId(), principal.getPlayerNumber(), sessionId, isFirstConnection, principal.getTeamCode());

            if (isFirstConnection) {
                webSocketPublisher.notifyPlayerConnection(
                        principal.getTeamId(),
                        principal.getPlayerId(),
                        principal.getPlayerNumber(),
                        principal.getDisplayName(),
                        true
                );
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        if (headerAccessor.getUser() instanceof PlayerAuthenticationToken auth && auth.getPrincipal() instanceof PlayerPrincipal principal) {
            boolean isLastDisconnection = sessionRegistry.unregisterPlayerSession(principal.getPlayerId(), sessionId);
            log.info("Player {} (P{}) disconnected STOMP session {} (last={}) for Team {}",
                    principal.getPlayerId(), principal.getPlayerNumber(), sessionId, isLastDisconnection, principal.getTeamCode());

            if (isLastDisconnection) {
                webSocketPublisher.notifyPlayerConnection(
                        principal.getTeamId(),
                        principal.getPlayerId(),
                        principal.getPlayerNumber(),
                        principal.getDisplayName(),
                        false
                );
            }
        } else if (sessionId != null) {
            Long playerId = sessionRegistry.getPlayerIdForSession(sessionId);
            if (playerId != null) {
                sessionRegistry.unregisterPlayerSession(playerId, sessionId);
            }
        }
    }
}
