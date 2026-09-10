package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findBySessionToken(String sessionToken);

    @org.springframework.data.jpa.repository.Query("SELECT gs FROM GameSession gs JOIN FETCH gs.player p JOIN FETCH gs.team t JOIN FETCH t.event e WHERE gs.sessionToken = :sessionToken")
    Optional<GameSession> findBySessionTokenWithDetails(@org.springframework.data.repository.query.Param("sessionToken") String sessionToken);

    Optional<GameSession> findByPlayerIdAndStatus(Long playerId, SessionStatus status);
    Optional<GameSession> findFirstByPlayerIdAndStatusOrderByCreatedAtDesc(Long playerId, SessionStatus status);
    boolean existsByPlayerIdAndStatus(Long playerId, SessionStatus status);
    java.util.List<GameSession> findAllByPlayerIdAndStatus(Long playerId, SessionStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT gs FROM GameSession gs WHERE gs.player.id IN :playerIds AND gs.status = :status")
    java.util.List<GameSession> findByPlayerIdInAndStatus(@org.springframework.data.repository.query.Param("playerIds") java.util.Collection<Long> playerIds, @org.springframework.data.repository.query.Param("status") SessionStatus status);

    Optional<GameSession> findTopByPlayerIdOrderByCreatedAtDesc(Long playerId);
    java.util.List<GameSession> findByTeamId(Long teamId);
    java.util.List<GameSession> findByStatus(SessionStatus status);
    java.util.List<GameSession> findByTeamIdAndStatus(Long teamId, SessionStatus status);
    void deleteByTeamId(Long teamId);
}
