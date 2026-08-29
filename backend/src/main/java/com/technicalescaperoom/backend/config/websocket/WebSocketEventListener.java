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

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getUser() instanceof PlayerAuthenticationToken auth && auth.getPrincipal() instanceof PlayerPrincipal principal) {
            log.info("Player {} (P{}) connected over WebSocket for Team {}", principal.getPlayerId(), principal.getPlayerNumber(), principal.getTeamCode());
            webSocketPublisher.notifyPlayerConnection(
                    principal.getTeamId(),
                    principal.getPlayerId(),
                    principal.getPlayerNumber(),
                    principal.getDisplayName(),
                    true
            );
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getUser() instanceof PlayerAuthenticationToken auth && auth.getPrincipal() instanceof PlayerPrincipal principal) {
            log.info("Player {} (P{}) disconnected from WebSocket for Team {}", principal.getPlayerId(), principal.getPlayerNumber(), principal.getTeamCode());
            webSocketPublisher.notifyPlayerConnection(
                    principal.getTeamId(),
                    principal.getPlayerId(),
                    principal.getPlayerNumber(),
                    principal.getDisplayName(),
                    false
            );
        }
    }
}
