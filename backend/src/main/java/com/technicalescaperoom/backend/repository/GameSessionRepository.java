package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findBySessionToken(String sessionToken);
    Optional<GameSession> findByPlayerIdAndStatus(Long playerId, SessionStatus status);
    java.util.List<GameSession> findAllByPlayerIdAndStatus(Long playerId, SessionStatus status);
    Optional<GameSession> findTopByPlayerIdOrderByCreatedAtDesc(Long playerId);
    java.util.List<GameSession> findByTeamId(Long teamId);
    java.util.List<GameSession> findByStatus(SessionStatus status);
    java.util.List<GameSession> findByTeamIdAndStatus(Long teamId, SessionStatus status);
    java.util.List<GameSession> findByTeamIdInAndStatus(java.util.List<Long> teamIds, SessionStatus status);
    void deleteByTeamId(Long teamId);
}
