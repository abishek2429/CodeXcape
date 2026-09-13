package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.ScoreEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreEventRepository extends JpaRepository<ScoreEvent, Long> {
    List<ScoreEvent> findByTeamIdOrderByCreatedAtDesc(Long teamId);
    Optional<ScoreEvent> findByTeamIdAndReferenceId(Long teamId, String referenceId);
    boolean existsByTeamIdAndReferenceId(Long teamId, String referenceId);
}
