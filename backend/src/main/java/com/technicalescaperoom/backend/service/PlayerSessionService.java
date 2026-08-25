package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerLoginRequest;
import com.technicalescaperoom.backend.dto.player.PlayerResponseDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.DuplicateLoginException;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerSessionService {

    public static final String COOKIE_NAME = "PLAYER_SESSION";

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final GameSessionRepository gameSessionRepository;
    private final AuditService auditService;

    @Value("${app.player.session-timeout-minutes:60}")
    private long sessionTimeoutMinutes;

    @Transactional
    public PlayerResponseDto login(PlayerLoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String normalizedTeamCode = request.getTeamCode().trim().toUpperCase();

        // 1. Resolve Team
        Team team = teamRepository.findByTeamCode(normalizedTeamCode)
                .orElseThrow(() -> {
                    auditService.logEvent(
                            GameEventType.PLAYER_LOGIN_FAILED,
                            null,
                            null,
                            null,
                            "{\"reason\": \"Team code not found\", \"teamCode\": \"" + normalizedTeamCode + "\"}",
                            "PLAYER"
                    );
                    return new ResourceNotFoundException("Team not found.");
                });

        // 2. Validate Event
        Event event = team.getEvent();
        if (event == null || (event.getStatus() != EventStatus.READY && event.getStatus() != EventStatus.RUNNING)) {
            auditService.logEvent(
                    GameEventType.PLAYER_LOGIN_FAILED,
                    event,
                    team,
                    null,
                    "{\"reason\": \"Event not accepting players\", \"status\": \"" + (event != null ? event.getStatus() : "NULL") + "\"}",
                    "PLAYER"
            );
            throw new EventUnavailableException("The event is not currently accepting players.");
        }

        // 3. Validate Team Status
        if (team.getStatus() == TeamStatus.DISQUALIFIED || team.getStatus() == TeamStatus.COMPLETED) {
            auditService.logEvent(
                    GameEventType.PLAYER_LOGIN_FAILED,
                    event,
                    team,
                    null,
                    "{\"reason\": \"Team is not active\", \"status\": \"" + team.getStatus() + "\"}",
                    "PLAYER"
            );
            throw new EventUnavailableException("The event is not currently accepting players.");
        }

        // 4. Resolve Player
        Player player = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), request.getPlayerNumber())
                .orElseThrow(() -> {
                    auditService.logEvent(
                            GameEventType.PLAYER_LOGIN_FAILED,
                            event,
                            team,
                            null,
                            "{\"reason\": \"Player number not found\", \"playerNumber\": " + request.getPlayerNumber() + "}",
                            "PLAYER"
                    );
                    return new ResourceNotFoundException("Selected player is not registered for this team.");
                });

        // 5. Active Session & Duplicate Login Check
        Optional<GameSession> activeSessionOpt = gameSessionRepository.findByPlayerIdAndStatus(player.getId(), SessionStatus.ACTIVE);
        String existingToken = extractTokenFromRequest(httpRequest);

        if (activeSessionOpt.isPresent()) {
            GameSession activeSession = activeSessionOpt.get();
            Instant timeoutThreshold = Instant.now().minusSeconds(sessionTimeoutMinutes * 60);

            if (activeSession.getLastActivityAt().isBefore(timeoutThreshold)) {
                // Session expired -> mark expired and proceed to issue a new session
                log.info("Active session {} for player {} expired. Marking EXPIRED.", activeSession.getSessionToken(), player.getId());
                activeSession.setStatus(SessionStatus.EXPIRED);
                activeSession.setIsConnected(false);
                activeSession.setDisconnectedAt(Instant.now());
                gameSessionRepository.save(activeSession);

                player.setStatus(PlayerStatus.DISCONNECTED);
                playerRepository.save(player);

                auditService.logEvent(
                        GameEventType.PLAYER_SESSION_EXPIRED,
                        event,
                        team,
                        player,
                        "{\"sessionToken\": \"" + activeSession.getSessionToken() + "\"}",
                        "SYSTEM"
                );
            } else if (existingToken != null && existingToken.equals(activeSession.getSessionToken())) {
                // Reconnection from same computer/browser with valid session token
                log.info("Reconnecting player {} with existing valid session {}", player.getId(), activeSession.getSessionToken());
                activeSession.setLastActivityAt(Instant.now());
                activeSession.setIsConnected(true);
                gameSessionRepository.save(activeSession);

                player.setStatus(PlayerStatus.CONNECTED);
                playerRepository.save(player);

                auditService.logEvent(
                        GameEventType.PLAYER_RECONNECTED,
                        event,
                        team,
                        player,
                        "{\"sessionToken\": \"" + activeSession.getSessionToken() + "\"}",
                        "PLAYER"
                );

                setSessionCookie(response, activeSession.getSessionToken());
                return mapToResponse(team, player);
            } else {
                // Duplicate login attempt from another computer!
                auditService.logEvent(
                        GameEventType.DUPLICATE_LOGIN_REJECTED,
                        event,
                        team,
                        player,
                        "{\"reason\": \"Duplicate connection attempt rejected\"}",
                        "PLAYER"
                );
                throw new DuplicateLoginException("This player is already connected from another computer.");
            }
        }

        // 6. Create New GameSession
        String newToken = UUID.randomUUID().toString();
        GameSession newSession = GameSession.builder()
                .team(team)
                .player(player)
                .sessionToken(newToken)
                .status(SessionStatus.ACTIVE)
                .isConnected(true)
                .createdAt(Instant.now())
                .lastActivityAt(Instant.now())
                .build();

        gameSessionRepository.save(newSession);

        // Update player status
        player.setStatus(PlayerStatus.CONNECTED);
        playerRepository.save(player);

        // Log audit event
        auditService.logEvent(
                GameEventType.PLAYER_LOGIN_SUCCESS,
                event,
                team,
                player,
                "{\"sessionToken\": \"" + newToken + "\"}",
                "PLAYER"
        );

        // Set Cookie & return DTO
        setSessionCookie(response, newToken);
        return mapToResponse(team, player);
    }

    @Transactional
    public PlayerResponseDto getCurrentPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        // Touch last activity
        Optional<GameSession> sessionOpt = gameSessionRepository.findBySessionToken(principal.getSessionToken());
        if (sessionOpt.isPresent()) {
            GameSession session = sessionOpt.get();
            if (session.getStatus() == SessionStatus.ACTIVE) {
                if (!Boolean.TRUE.equals(session.getIsConnected())) {
                    session.setIsConnected(true);
                    auditService.logEvent(
                            GameEventType.PLAYER_RECONNECTED,
                            team.getEvent(),
                            team,
                            player,
                            "{\"sessionToken\": \"" + session.getSessionToken() + "\"}",
                            "PLAYER"
                    );
                }
                session.setLastActivityAt(Instant.now());
                gameSessionRepository.save(session);
            }
        }

        return mapToResponse(team, player);
    }

    @Transactional
    public void logout(PlayerPrincipal principal, HttpServletResponse response) {
        if (principal != null && principal.getSessionToken() != null) {
            Optional<GameSession> sessionOpt = gameSessionRepository.findBySessionToken(principal.getSessionToken());
            if (sessionOpt.isPresent()) {
                GameSession session = sessionOpt.get();
                session.setStatus(SessionStatus.TERMINATED);
                session.setIsConnected(false);
                session.setDisconnectedAt(Instant.now());
                gameSessionRepository.save(session);

                Player player = session.getPlayer();
                if (player != null) {
                    player.setStatus(PlayerStatus.DISCONNECTED);
                    playerRepository.save(player);

                    auditService.logEvent(
                            GameEventType.PLAYER_LOGOUT,
                            session.getTeam().getEvent(),
                            session.getTeam(),
                            player,
                            "{\"sessionToken\": \"" + session.getSessionToken() + "\"}",
                            "PLAYER"
                    );
                }
            }
        }

        clearSessionCookie(response);
    }

    private void setSessionCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (sessionTimeoutMinutes * 60));
        response.addCookie(cookie);
    }

    private void clearSessionCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        if (request == null) return null;

        String headerToken = request.getHeader("X-Player-Session");
        if (headerToken != null && !headerToken.isBlank()) {
            return headerToken.trim();
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue().trim();
                }
            }
        }
        return null;
    }

    private PlayerResponseDto mapToResponse(Team team, Player player) {
        return PlayerResponseDto.builder()
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .playerNumber(player.getPlayerNumber())
                .playerName(player.getDisplayName() != null ? player.getDisplayName() : "Player " + player.getPlayerNumber())
                .status(player.getStatus().name())
                .eventId(team.getEvent().getId())
                .teamId(team.getId())
                .playerId(player.getId())
                .build();
    }
}
