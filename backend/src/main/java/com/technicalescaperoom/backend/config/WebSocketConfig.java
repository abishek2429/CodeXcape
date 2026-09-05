package com.technicalescaperoom.backend.config;

import com.technicalescaperoom.backend.config.security.PlayerAuthenticationToken;
import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final GameSessionRepository gameSessionRepository;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toArray(String[]::new))
                .withSockJS();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toArray(String[]::new));
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                StompCommand command = accessor.getCommand();

                if (StompCommand.CONNECT.equals(command)) {
                    String token = extractSessionToken(accessor);
                    if (token == null || token.isBlank()) {
                        log.warn("WebSocket CONNECT rejected: Missing session token");
                        throw new MessageDeliveryException("Unauthorized: Missing session token");
                    }

                    GameSession session = gameSessionRepository.findBySessionToken(token)
                            .filter(s -> s.getStatus() == SessionStatus.ACTIVE)
                            .orElseThrow(() -> new MessageDeliveryException("Unauthorized: Invalid or expired session token"));

                    Player player = session.getPlayer();
                    PlayerPrincipal principal = PlayerPrincipal.builder()
                            .playerId(player.getId())
                            .teamId(player.getTeam().getId())
                            .eventId(player.getTeam().getEvent().getId())
                            .playerNumber(player.getPlayerNumber())
                            .teamCode(player.getTeam().getTeamCode())
                            .teamName(player.getTeam().getTeamName())
                            .displayName(player.getDisplayName())
                            .sessionToken(token)
                            .build();

                    PlayerAuthenticationToken authentication = new PlayerAuthenticationToken(principal, token);
                    accessor.setUser(authentication);
                    log.info("WebSocket CONNECT authenticated for player {} (Team {})", player.getId(), player.getTeam().getTeamCode());
                } else if (StompCommand.SUBSCRIBE.equals(command)) {
                    String destination = accessor.getDestination();
                    PlayerAuthenticationToken user = (PlayerAuthenticationToken) accessor.getUser();

                    if (user == null || !(user.getPrincipal() instanceof PlayerPrincipal principal)) {
                        log.warn("WebSocket SUBSCRIBE rejected: Unauthenticated session");
                        throw new MessageDeliveryException("Unauthorized: Subscription requires authentication");
                    }

                    if (destination != null && destination.startsWith("/topic/team/")) {
                        try {
                            String teamIdStr = destination.substring("/topic/team/".length());
                            Long requestedTeamId = Long.parseLong(teamIdStr);

                            if (!principal.getTeamId().equals(requestedTeamId)) {
                                log.warn("Security Alert: Player {} (Team {}) attempted unauthorized subscription to /topic/team/{}", principal.getPlayerId(), principal.getTeamId(), requestedTeamId);
                                throw new MessageDeliveryException("Unauthorized subscription: You can only subscribe to your team's channel.");
                            }
                        } catch (NumberFormatException e) {
                            throw new MessageDeliveryException("Invalid team channel destination");
                        }
                    }
                }

                return message;
            }
        });
    }

    private String extractSessionToken(StompHeaderAccessor accessor) {
        // 1. Check STOMP headers: "token" or "sessionToken"
        String token = accessor.getFirstNativeHeader("token");
        if (token != null && !token.isBlank()) return token;

        token = accessor.getFirstNativeHeader("sessionToken");
        if (token != null && !token.isBlank()) return token;

        // 2. Check Cookie header if present
        List<String> cookieHeaders = accessor.getNativeHeader("cookie");
        if (cookieHeaders != null && !cookieHeaders.isEmpty()) {
            for (String cookieHeader : cookieHeaders) {
                String[] cookies = cookieHeader.split(";");
                for (String cookie : cookies) {
                    String[] pair = cookie.trim().split("=");
                    if (pair.length == 2 && "PLAYER_SESSION".equals(pair[0].trim())) {
                        return pair[1].trim();
                    }
                }
            }
        }

        return null;
    }
}
