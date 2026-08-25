package com.technicalescaperoom.backend.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlayerSessionAuthenticationFilter extends OncePerRequestFilter {

    public static final String COOKIE_NAME = "PLAYER_SESSION";
    public static final String HEADER_NAME = "X-Player-Session";

    private final GameSessionRepository gameSessionRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.player.session-timeout-minutes:60}")
    private long sessionTimeoutMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && !token.isBlank()) {
            Optional<GameSession> sessionOpt = gameSessionRepository.findBySessionToken(token);

            if (sessionOpt.isPresent()) {
                GameSession session = sessionOpt.get();

                if (session.getStatus() == SessionStatus.ACTIVE) {
                    Instant timeoutThreshold = Instant.now().minusSeconds(sessionTimeoutMinutes * 60);

                    if (session.getLastActivityAt().isBefore(timeoutThreshold)) {
                        log.info("Session {} expired for player ID {}", token, session.getPlayer().getId());
                        session.setStatus(SessionStatus.EXPIRED);
                        session.setIsConnected(false);
                        session.setDisconnectedAt(Instant.now());
                        gameSessionRepository.save(session);

                        if (isProtectedPlayerRoute(request)) {
                            sendJsonError(response, HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED", "Session has expired. Please log in again.");
                            return;
                        }
                    } else {
                        PlayerPrincipal principal = PlayerPrincipal.builder()
                                .playerId(session.getPlayer().getId())
                                .teamId(session.getTeam().getId())
                                .eventId(session.getTeam().getEvent().getId())
                                .playerNumber(session.getPlayer().getPlayerNumber())
                                .teamCode(session.getTeam().getTeamCode())
                                .teamName(session.getTeam().getTeamName())
                                .displayName(session.getPlayer().getDisplayName())
                                .sessionToken(session.getSessionToken())
                                .build();

                        PlayerAuthenticationToken authentication = new PlayerAuthenticationToken(principal, token);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } else if (isProtectedPlayerRoute(request)) {
                    sendJsonError(response, HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Session is inactive or terminated.");
                    return;
                }
            } else if (isProtectedPlayerRoute(request)) {
                sendJsonError(response, HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid authentication session.");
                return;
            }
        } else if (isProtectedPlayerRoute(request)) {
            sendJsonError(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Authentication required to access player endpoints.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProtectedPlayerRoute(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/api/player/") && !uri.equals("/api/player/login");
    }

    private String extractToken(HttpServletRequest request) {
        // 1. Check Header X-Player-Session
        String headerToken = request.getHeader(HEADER_NAME);
        if (headerToken != null && !headerToken.isBlank()) {
            return headerToken.trim();
        }

        // 2. Check Header Authorization: Bearer <token>
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        // 3. Check Cookie
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue().trim();
                }
            }
        }

        return null;
    }

    private void sendJsonError(HttpServletResponse response, HttpStatus status, String errorCode, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("status", status.value());
        errorDetails.put("error", status.getReasonPhrase());
        errorDetails.put("code", errorCode);
        errorDetails.put("message", message);
        errorDetails.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
    }
}
