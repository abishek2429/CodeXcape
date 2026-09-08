package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerLoginRequest;
import com.technicalescaperoom.backend.dto.player.PlayerResponseDto;
import com.technicalescaperoom.backend.dto.websocket.WebSocketEventDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.*;
import com.technicalescaperoom.backend.exception.AccountDisabledException;
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
import java.util.List;
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
    private final jakarta.persistence.EntityManager entityManager;
    private final GameWebSocketPublisher webSocketPublisher;
    private final GameStateService gameStateService;

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

        // 4. Resolve Player & Account Eligibility
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

        if (Boolean.FALSE.equals(player.getIsActive())) {
            auditService.logEvent(
                    GameEventType.PLAYER_LOGIN_FAILED,
                    event,
                    team,
                    player,
                    "{\"reason\": \"Player account is deactivated or ineligible\"}",
                    "PLAYER"
            );
            throw new AccountDisabledException("Player account is deactivated or ineligible.");
        }

        // 5. Active Session Handling & Clean Session Rotation
        List<GameSession> activeSessions = gameSessionRepository.findAllByPlayerIdAndStatus(player.getId(), SessionStatus.ACTIVE);
        String existingToken = extractTokenFromRequest(httpRequest);

        if (!activeSessions.isEmpty()) {
            Instant timeoutThreshold = Instant.now().minusSeconds(sessionTimeoutMinutes * 60);

            for (GameSession activeSession : activeSessions) {
                if (activeSession.getLastActivityAt().isBefore(timeoutThreshold)) {
                    // Session expired -> mark expired
                    log.info("Active session {} for player {} expired. Marking EXPIRED.", activeSession.getSessionToken(), player.getId());
                    activeSession.setStatus(SessionStatus.EXPIRED);
                    activeSession.setIsConnected(false);
                    activeSession.setDisconnectedAt(Instant.now());
                    gameSessionRepository.save(activeSession);

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
                    webSocketPublisher.notifyPlayerConnection(team.getId(), player.getId(), player.getPlayerNumber(), player.getDisplayName(), true);
                    return mapToResponse(team, player, activeSession.getSessionToken());
                } else {
                    // Repeated login or session rotation (pre-event or active gameplay):
                    // Cleanly terminate previous session and proceed to issue a fresh active session
                    log.info("Session rotation: terminating prior active session {} for player {}", activeSession.getSessionToken(), player.getId());
                    activeSession.setStatus(SessionStatus.TERMINATED);
                    activeSession.setIsConnected(false);
                    activeSession.setDisconnectedAt(Instant.now());
                    gameSessionRepository.save(activeSession);
                }
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

        // Broadcast player connection event to team via WebSocket
        webSocketPublisher.notifyPlayerConnection(team.getId(), player.getId(), player.getPlayerNumber(), player.getDisplayName(), true);

        // Set Cookie & return DTO
        setSessionCookie(response, newToken);
        return mapToResponse(team, player, newToken);
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
                    webSocketPublisher.notifyPlayerConnection(team.getId(), player.getId(), player.getPlayerNumber(), player.getDisplayName(), true);
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

        return mapToResponse(team, player, principal.getSessionToken());
    }

    @Transactional(readOnly = true)
    public PlayerResponseDto getLobbyState(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        return mapToResponse(team, player, principal.getSessionToken());
    }

    @Transactional
    public PlayerResponseDto setPlayerReady(PlayerPrincipal principal, boolean isReady) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        if (team.getGameState() != TeamGameState.NOT_STARTED) {
            throw new IllegalStateException("Event has already started.");
        }

        player.setIsReady(isReady);
        playerRepository.save(player);

        // Broadcast readiness change over WebSocket
        WebSocketEventDto readyEvent = WebSocketEventDto.builder()
                .type(WebSocketEventType.PLAYER_READY_CHANGED)
                .teamId(team.getId())
                .playerId(player.getId())
                .playerNumber(player.getPlayerNumber())
                .displayName(player.getDisplayName())
                .message("Player " + player.getPlayerNumber() + (isReady ? " is READY" : " is WAITING"))
                .timestamp(Instant.now())
                .build();
        webSocketPublisher.broadcastToTeam(team.getId(), readyEvent);

        return mapToResponse(team, player, principal.getSessionToken());
    }

    @Transactional
    public PlayerResponseDto startTeamEvent(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Event event = team.getEvent();
        if (event == null || (event.getStatus() != EventStatus.READY && event.getStatus() != EventStatus.RUNNING)) {
            throw new EventUnavailableException("Event is not currently accepting starts.");
        }

        if (team.getStatus() == TeamStatus.DISQUALIFIED || team.getStatus() == TeamStatus.COMPLETED) {
            throw new EventUnavailableException("Team cannot start the event in its current status.");
        }

        // Idempotency: if already started, return current state
        if (team.getGameState() != TeamGameState.NOT_STARTED) {
            return mapToResponse(team, player, principal.getSessionToken());
        }

        // Two-Player Start Verification
        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        if (teamPlayers.size() < 2) {
            throw new IllegalStateException("Both players must be registered for the team before starting.");
        }

        for (Player p : teamPlayers) {
            if (p.getId().equals(player.getId())) {
                p.setIsReady(true);
                playerRepository.save(p);
            } else {
                Optional<GameSession> teammateSession = gameSessionRepository.findByPlayerIdAndStatus(p.getId(), SessionStatus.ACTIVE);
                if (teammateSession.isEmpty()) {
                    throw new IllegalStateException("OPERATOR 0" + p.getPlayerNumber() + " IS NOT LOGGED IN. BOTH OPERATORS MUST BE PRESENT.");
                }
                if (!Boolean.TRUE.equals(p.getIsReady())) {
                    throw new IllegalStateException("WAITING FOR SECOND OPERATOR. OPERATOR 0" + p.getPlayerNumber() + " MUST CONFIRM READINESS.");
                }
            }
        }

        // Both players verified ready! Officially record authoritative server start time
        Instant serverStartTime = Instant.now();
        team.setStartedAt(serverStartTime);
        team.setGameState(TeamGameState.IN_PROGRESS);
        teamRepository.save(team);

        // Initialize Level 1 and stage progress
        gameStateService.initializeTeamGameState(team);

        auditService.logEvent(
                GameEventType.LEVEL_STARTED,
                event,
                team,
                player,
                "{\"action\": \"TEAM_EVENT_STARTED\", \"startedAt\": \"" + serverStartTime + "\"}",
                "PLAYER"
        );

        // Broadcast EVENT_STARTED to both players via WebSocket
        WebSocketEventDto startEvent = WebSocketEventDto.builder()
                .type(WebSocketEventType.EVENT_STARTED)
                .teamId(team.getId())
                .message("TEAM VERIFIED: EVENT OFFICIALLY STARTED")
                .serverTime(serverStartTime)
                .timestamp(serverStartTime)
                .build();
        webSocketPublisher.broadcastToTeam(team.getId(), startEvent);

        log.info("Team ID {} ({}) officially started event at {}", team.getId(), team.getTeamCode(), serverStartTime);
        return mapToResponse(team, player, principal.getSessionToken());
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
                    player.setIsReady(false);
                    playerRepository.save(player);

                    webSocketPublisher.notifyPlayerConnection(session.getTeam().getId(), player.getId(), player.getPlayerNumber(), player.getDisplayName(), false);

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

    @Transactional
    public void revokeSession(com.technicalescaperoom.backend.config.security.AdminPrincipal principal, Long sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found for ID " + sessionId));

        session.setStatus(SessionStatus.TERMINATED);
        session.setIsConnected(false);
        session.setDisconnectedAt(Instant.now());
        gameSessionRepository.save(session);

        Player player = session.getPlayer();
        if (player != null) {
            player.setStatus(PlayerStatus.DISCONNECTED);
            player.setIsReady(false);
            playerRepository.save(player);
            webSocketPublisher.notifyPlayerConnection(session.getTeam().getId(), player.getId(), player.getPlayerNumber(), player.getDisplayName(), false);
        }

        auditService.logEvent(
                GameEventType.PLAYER_LOGOUT,
                session.getTeam().getEvent(),
                session.getTeam(),
                player,
                "{\"reason\": \"Revoked by Admin " + (principal != null ? principal.getUsername() : "SYSTEM") + "\"}",
                "ADMIN"
        );

        log.info("Admin {} revoked session ID {} for Player {}", principal != null ? principal.getUsername() : "SYSTEM", sessionId, player != null ? player.getId() : "UNKNOWN");
    }

    @Transactional
    public void resetTeamCredentialsAndSessions(com.technicalescaperoom.backend.config.security.AdminPrincipal principal, Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + teamId));

        log.info("Admin {} resetting credentials and sessions for Team {} (#{})",
                principal != null ? principal.getUsername() : "SYSTEM", team.getTeamCode(), teamId);

        // 1. Terminate all sessions for this team
        for (GameSession session : gameSessionRepository.findByTeamId(teamId)) {
            session.setStatus(SessionStatus.TERMINATED);
            session.setIsConnected(false);
            session.setDisconnectedAt(Instant.now());
            gameSessionRepository.save(session);
        }

        // 2. Reset all players on this team to INACTIVE and not ready
        for (Player player : playerRepository.findByTeamId(teamId)) {
            player.setStatus(PlayerStatus.INACTIVE);
            player.setIsReady(false);
            playerRepository.save(player);
            webSocketPublisher.notifyPlayerConnection(teamId, player.getId(), player.getPlayerNumber(), player.getDisplayName(), false);
        }

        // 3. Purge team progress, attempts, and hint usages
        entityManager.createQuery("DELETE FROM AnswerAttempt a WHERE a.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM DiscoverySubmission d WHERE d.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM TeamStageProgress s WHERE s.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM TeamLevelProgress l WHERE l.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM HintUsage h WHERE h.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();

        // 4. Reset team state back to clean initial state
        team.setStatus(TeamStatus.REGISTERED);
        team.setGameState(TeamGameState.NOT_STARTED);
        team.setStartedAt(null);
        team.setCompletedAt(null);
        teamRepository.saveAndFlush(team);

        // 5. Broadcast reset event over WebSocket
        webSocketPublisher.notifyEventStatusChange(teamId, "Team session and credentials have been reset by administrator.");

        auditService.logEvent(
                GameEventType.PLAYER_LOGOUT,
                team.getEvent(),
                team,
                null,
                "{\"action\": \"RESET_TEAM_CREDENTIALS\", \"admin\": \"" + (principal != null ? principal.getUsername() : "SYSTEM") + "\"}",
                "ADMIN"
        );
    }

    @Transactional
    public void resetAllSessionsAndCredentials(com.technicalescaperoom.backend.config.security.AdminPrincipal principal) {
        log.info("Admin {} initiated global reset of all team sessions and credentials.",
                principal != null ? principal.getUsername() : "SYSTEM");

        // 1. Terminate all game sessions
        List<GameSession> allActiveSessions = gameSessionRepository.findByStatus(SessionStatus.ACTIVE);
        for (GameSession session : allActiveSessions) {
            session.setStatus(SessionStatus.TERMINATED);
            session.setIsConnected(false);
            session.setDisconnectedAt(Instant.now());
            gameSessionRepository.save(session);
        }

        // 2. Reset all players
        List<Player> allPlayers = playerRepository.findAll();
        for (Player player : allPlayers) {
            player.setStatus(PlayerStatus.INACTIVE);
            player.setIsReady(false);
            playerRepository.save(player);
        }

        // 3. Reset all teams
        List<Team> allTeams = teamRepository.findAll();
        for (Team team : allTeams) {
            team.setStatus(TeamStatus.REGISTERED);
            team.setGameState(TeamGameState.NOT_STARTED);
            team.setStartedAt(null);
            team.setCompletedAt(null);
            teamRepository.save(team);
            webSocketPublisher.notifyEventStatusChange(team.getId(), "Event session reset by administrator.");
        }
        teamRepository.flush();

        // 4. Purge all game progression tables
        entityManager.createQuery("DELETE FROM AnswerAttempt").executeUpdate();
        entityManager.createQuery("DELETE FROM DiscoverySubmission").executeUpdate();
        entityManager.createQuery("DELETE FROM TeamStageProgress").executeUpdate();
        entityManager.createQuery("DELETE FROM TeamLevelProgress").executeUpdate();
        entityManager.createQuery("DELETE FROM HintUsage").executeUpdate();

        auditService.logEvent(
                GameEventType.PLAYER_LOGOUT,
                null,
                null,
                null,
                "{\"action\": \"RESET_ALL_SESSIONS_AND_CREDENTIALS\", \"admin\": \"" + (principal != null ? principal.getUsername() : "SYSTEM") + "\"}",
                "ADMIN"
        );
    }

    @Transactional
    public void revokeAllTeamSessions(com.technicalescaperoom.backend.config.security.AdminPrincipal principal, Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + teamId));

        List<GameSession> activeSessions = gameSessionRepository.findByTeamIdAndStatus(teamId, SessionStatus.ACTIVE);
        for (GameSession session : activeSessions) {
            session.setStatus(SessionStatus.TERMINATED);
            session.setIsConnected(false);
            session.setDisconnectedAt(Instant.now());
            gameSessionRepository.save(session);
        }

        for (Player player : playerRepository.findByTeamId(teamId)) {
            player.setStatus(PlayerStatus.DISCONNECTED);
            player.setIsReady(false);
            playerRepository.save(player);
            webSocketPublisher.notifyPlayerConnection(teamId, player.getId(), player.getPlayerNumber(), player.getDisplayName(), false);
        }

        auditService.logEvent(
                GameEventType.PLAYER_LOGOUT,
                team.getEvent(),
                team,
                null,
                "{\"action\": \"REVOKE_ALL_TEAM_SESSIONS\", \"admin\": \"" + (principal != null ? principal.getUsername() : "SYSTEM") + "\"}",
                "ADMIN"
        );

        log.info("Admin {} revoked all active sessions for Team {} (#{})",
                principal != null ? principal.getUsername() : "SYSTEM", team.getTeamCode(), teamId);
    }

    @Transactional
    public void resetTestTeam() {
        Optional<Team> testTeamOpt = teamRepository.findByTeamCode("CODEXCAPE-TEST");
        if (testTeamOpt.isEmpty()) {
            return;
        }
        Team team = testTeamOpt.get();
        Long teamId = team.getId();

        entityManager.createQuery("DELETE FROM AnswerAttempt a WHERE a.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM DiscoverySubmission d WHERE d.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM TeamStageProgress s WHERE s.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM TeamLevelProgress l WHERE l.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();
        entityManager.createQuery("DELETE FROM HintUsage h WHERE h.team.id = :teamId").setParameter("teamId", teamId).executeUpdate();

        for (GameSession session : gameSessionRepository.findByTeamId(teamId)) {
            session.setStatus(SessionStatus.TERMINATED);
            session.setIsConnected(false);
            session.setDisconnectedAt(Instant.now());
            gameSessionRepository.save(session);
        }

        for (Player player : playerRepository.findByTeamId(teamId)) {
            player.setStatus(PlayerStatus.INACTIVE);
            player.setIsReady(false);
            playerRepository.save(player);
        }

        team.setGameState(TeamGameState.NOT_STARTED);
        team.setStartedAt(null);
        team.setCompletedAt(null);
        teamRepository.saveAndFlush(team);

        log.info("Reset CODEXCAPE-TEST team game state, progress, and sessions to initial state.");
    }

    private void setSessionCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (sessionTimeoutMinutes * 60));
        cookie.setSecure(true);
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
    }

    private void clearSessionCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setSecure(true);
        cookie.setAttribute("SameSite", "None");
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

    private PlayerResponseDto mapToResponse(Team team, Player player, String sessionToken) {
        Integer teammateNumber = player.getPlayerNumber() == 1 ? 2 : 1;
        Optional<Player> teammateOpt = playerRepository.findByTeamIdAndPlayerNumber(team.getId(), teammateNumber);

        String teammateName = null;
        boolean teammateLoggedIn = false;
        boolean teammateReady = false;

        if (teammateOpt.isPresent()) {
            Player teammate = teammateOpt.get();
            teammateName = teammate.getDisplayName() != null ? teammate.getDisplayName() : "Player " + teammateNumber;
            teammateReady = Boolean.TRUE.equals(teammate.getIsReady());
            teammateLoggedIn = gameSessionRepository.findByPlayerIdAndStatus(teammate.getId(), SessionStatus.ACTIVE).isPresent();
        }

        return PlayerResponseDto.builder()
                .sessionToken(sessionToken)
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .playerNumber(player.getPlayerNumber())
                .playerName(player.getDisplayName() != null ? player.getDisplayName() : "Player " + player.getPlayerNumber())
                .status(player.getStatus().name())
                .eventId(team.getEvent().getId())
                .teamId(team.getId())
                .playerId(player.getId())
                .isActive(player.getIsActive())
                .isReady(Boolean.TRUE.equals(player.getIsReady()))
                .gameState(team.getGameState().name())
                .eventStatus(team.getEvent() != null ? team.getEvent().getStatus().name() : "UNKNOWN")
                .eventStartedAt(team.getStartedAt())
                .teammateName(teammateName)
                .teammateNumber(teammateNumber)
                .teammateLoggedIn(teammateLoggedIn)
                .teammateReady(teammateReady)
                .build();
    }
}
