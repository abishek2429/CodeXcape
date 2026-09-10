package com.technicalescaperoom.backend.config.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe in-memory registry tracking active STOMP sessions for players and administrators.
 * Prevents rapid online/offline flapping during page refreshes and multi-tab browsing.
 */
@Slf4j
@Component
public class WebSocketSessionRegistry {

    // Map of playerId -> Set of stompSessionIds
    private final Map<Long, Set<String>> playerSessions = new ConcurrentHashMap<>();

    // Map of stompSessionId -> playerId for fast reverse lookup on disconnect
    private final Map<String, Long> sessionToPlayer = new ConcurrentHashMap<>();

    // Total active STOMP sessions counter
    private final AtomicInteger totalActiveSessions = new AtomicInteger(0);

    /**
     * Registers a new STOMP session for a player.
     * @return true if this is the player's FIRST active connection (transition to ONLINE).
     */
    public boolean registerPlayerSession(Long playerId, String stompSessionId) {
        if (playerId == null || stompSessionId == null) return false;

        sessionToPlayer.put(stompSessionId, playerId);
        totalActiveSessions.incrementAndGet();

        Set<String> sessions = playerSessions.computeIfAbsent(playerId, k -> ConcurrentHashMap.newKeySet());
        boolean isFirst = sessions.isEmpty();
        sessions.add(stompSessionId);

        log.debug("Registered STOMP session {} for Player {}. Active sessions for player: {}, Total: {}",
                stompSessionId, playerId, sessions.size(), totalActiveSessions.get());

        return isFirst;
    }

    /**
     * Unregisters a STOMP session for a player.
     * @return true if this was the player's LAST active connection (transition to OFFLINE).
     */
    public boolean unregisterPlayerSession(Long playerId, String stompSessionId) {
        if (playerId == null || stompSessionId == null) return false;

        sessionToPlayer.remove(stompSessionId);
        totalActiveSessions.decrementAndGet();

        Set<String> sessions = playerSessions.get(playerId);
        if (sessions == null) return false;

        sessions.remove(stompSessionId);
        boolean isLast = sessions.isEmpty();
        if (isLast) {
            playerSessions.remove(playerId);
        }

        log.debug("Unregistered STOMP session {} for Player {}. Remaining sessions for player: {}, Total: {}",
                stompSessionId, playerId, sessions.size(), totalActiveSessions.get());

        return isLast;
    }

    /**
     * Resolves the playerId associated with a given stompSessionId.
     */
    public Long getPlayerIdForSession(String stompSessionId) {
        if (stompSessionId == null) return null;
        return sessionToPlayer.get(stompSessionId);
    }

    /**
     * Checks if a player has any active WebSocket sessions.
     */
    public boolean isPlayerConnected(Long playerId) {
        if (playerId == null) return false;
        Set<String> sessions = playerSessions.get(playerId);
        return sessions != null && !sessions.isEmpty();
    }

    /**
     * Returns the total count of currently connected STOMP sessions.
     */
    public int getActiveConnectionCount() {
        return Math.max(0, totalActiveSessions.get());
    }

    /**
     * Returns unmodifiable set of sessions for a player.
     */
    public Set<String> getSessionsForPlayer(Long playerId) {
        Set<String> sessions = playerSessions.get(playerId);
        return sessions != null ? Collections.unmodifiableSet(sessions) : Collections.emptySet();
    }

    /**
     * Clears all session mappings (useful for testing).
     */
    public void clear() {
        playerSessions.clear();
        sessionToPlayer.clear();
        totalActiveSessions.set(0);
    }
}
