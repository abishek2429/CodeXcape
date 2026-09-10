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
    private final com.technicalescaperoom.backend.repository.AdminSessionRepository adminSessionRepository;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://code-xcape.vercel.app,https://*.vercel.app}")
    private String allowedOrigins;

    @org.springframework.context.annotation.Bean
    public org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler stompHeartbeatTaskScheduler() {
        org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler scheduler = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("stomp-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic")
                .setTaskScheduler(stompHeartbeatTaskScheduler())
                .setHeartbeatValue(new long[]{10000, 10000});
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = new java.util.ArrayList<>();
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String o : allowedOrigins.split(",")) {
                String trimmed = o.trim();
                if (!trimmed.isEmpty() && !origins.contains(trimmed)) {
                    origins.add(trimmed);
                }
            }
        }
        for (String def : Arrays.asList("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "https://code-xcape.vercel.app", "https://*.vercel.app")) {
            if (!origins.contains(def)) origins.add(def);
        }

        String[] patterns = origins.toArray(String[]::new);

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(patterns)
                .withSockJS();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(patterns);
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

                    // 1. Try Player GameSession
                    java.util.Optional<GameSession> playerSessionOpt = gameSessionRepository.findBySessionToken(token)
                            .filter(s -> s.getStatus() == SessionStatus.ACTIVE);

                    if (playerSessionOpt.isPresent()) {
                        GameSession session = playerSessionOpt.get();
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
                    } else {
                        // 2. Try AdminSession
                        java.util.Optional<com.technicalescaperoom.backend.entity.AdminSession> adminSessionOpt = adminSessionRepository.findBySessionToken(token)
                                .filter(s -> s.getStatus() == SessionStatus.ACTIVE);

                        if (adminSessionOpt.isPresent()) {
                            com.technicalescaperoom.backend.config.security.AdminPrincipal adminPrincipal =
                                    com.technicalescaperoom.backend.config.security.AdminPrincipal.builder()
                                            .username("admin")
                                            .role(com.technicalescaperoom.backend.enums.UserRole.ADMIN)
                                            .build();

                            org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                            adminPrincipal, token, adminPrincipal.getAuthorities());
                            accessor.setUser(auth);
                            log.info("WebSocket CONNECT authenticated for admin session {}", token);
                        } else {
                            log.warn("WebSocket CONNECT rejected: Invalid or expired session token");
                            throw new MessageDeliveryException("Unauthorized: Invalid or expired session token");
                        }
                    }
                } else if (StompCommand.SUBSCRIBE.equals(command)) {
                    String destination = accessor.getDestination();
                    java.security.Principal auth = accessor.getUser();

                    if (auth == null) {
                        log.warn("WebSocket SUBSCRIBE rejected: Unauthenticated session");
                        throw new MessageDeliveryException("Unauthorized: Subscription requires authentication");
                    }

                    Object principal = (auth instanceof org.springframework.security.core.Authentication a) ? a.getPrincipal() : null;

                    if (principal instanceof PlayerPrincipal playerPrincipal) {
                        if (destination != null && destination.startsWith("/topic/admin")) {
                            log.warn("Security Alert: Player {} attempted unauthorized subscription to /topic/admin", playerPrincipal.getPlayerId());
                            throw new MessageDeliveryException("Unauthorized subscription: Player cannot subscribe to admin channels.");
                        }

                        if (destination != null && destination.startsWith("/topic/team/")) {
                            try {
                                String teamIdStr = destination.substring("/topic/team/".length());
                                Long requestedTeamId = Long.parseLong(teamIdStr);

                                if (!playerPrincipal.getTeamId().equals(requestedTeamId)) {
                                    log.warn("Security Alert: Player {} (Team {}) attempted unauthorized subscription to /topic/team/{}",
                                            playerPrincipal.getPlayerId(), playerPrincipal.getTeamId(), requestedTeamId);
                                    throw new MessageDeliveryException("Unauthorized subscription: You can only subscribe to your team's channel.");
                                }
                            } catch (NumberFormatException e) {
                                throw new MessageDeliveryException("Invalid team channel destination");
                            }
                        }
                    } else if (principal instanceof com.technicalescaperoom.backend.config.security.AdminPrincipal) {
                        // Admin authorized for monitoring channels
                    } else {
                        throw new MessageDeliveryException("Unauthorized: Invalid principal for subscription");
                    }
                }

                return message;
            }
        });
    }

    private String extractSessionToken(StompHeaderAccessor accessor) {
        // 1. Check STOMP headers: "token", "sessionToken", "adminToken", "X-Player-Session", "X-Admin-Session"
        for (String headerName : Arrays.asList("sessionToken", "token", "adminToken", "X-Player-Session", "X-Admin-Session")) {
            String token = accessor.getFirstNativeHeader(headerName);
            if (token != null && !token.isBlank()) return token.trim();
        }

        // 2. Check Cookie header if present
        List<String> cookieHeaders = accessor.getNativeHeader("cookie");
        if (cookieHeaders != null && !cookieHeaders.isEmpty()) {
            for (String cookieHeader : cookieHeaders) {
                String[] cookies = cookieHeader.split(";");
                for (String cookie : cookies) {
                    String[] pair = cookie.trim().split("=");
                    if (pair.length == 2) {
                        String cookieName = pair[0].trim();
                        if ("PLAYER_SESSION".equals(cookieName) || "ADMIN_SESSION".equals(cookieName)) {
                            return pair[1].trim();
                        }
                    }
                }
            }
        }

        return null;
    }
}
