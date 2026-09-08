package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findBySessionToken(String sessionToken);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM GameSession s JOIN FETCH s.player p JOIN FETCH s.team t JOIN FETCH t.event e WHERE s.sessionToken = :sessionToken")
    Optional<GameSession> findBySessionTokenWithDetails(@org.springframework.data.repository.query.Param("sessionToken") String sessionToken);
    Optional<GameSession> findByPlayerIdAndStatus(Long playerId, SessionStatus status);
    java.util.List<GameSession> findAllByPlayerIdAndStatus(Long playerId, SessionStatus status);
    Optional<GameSession> findTopByPlayerIdOrderByCreatedAtDesc(Long playerId);
    java.util.List<GameSession> findByTeamId(Long teamId);
    java.util.List<GameSession> findByStatus(SessionStatus status);
    java.util.List<GameSession> findByTeamIdAndStatus(Long teamId, SessionStatus status);
    java.util.List<GameSession> findByTeamIdInAndStatus(java.util.List<Long> teamIds, SessionStatus status);
    void deleteByTeamId(Long teamId);
}
