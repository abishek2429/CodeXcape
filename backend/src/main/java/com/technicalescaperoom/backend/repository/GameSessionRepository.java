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
    Optional<GameSession> findTopByPlayerIdOrderByCreatedAtDesc(Long playerId);
    java.util.List<GameSession> findByTeamId(Long teamId);
}
