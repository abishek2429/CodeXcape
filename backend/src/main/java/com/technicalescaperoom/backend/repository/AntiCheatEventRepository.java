package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.AntiCheatEvent;
import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AntiCheatEventRepository extends JpaRepository<AntiCheatEvent, Long> {

    List<AntiCheatEvent> findByTeamIdOrderByDetectedAtDesc(Long teamId);

    List<AntiCheatEvent> findByEventIdOrderByDetectedAtDesc(Long eventId);

    Page<AntiCheatEvent> findByEventIdOrderByDetectedAtDesc(Long eventId, Pageable pageable);

    Optional<AntiCheatEvent> findTopByPlayerIdAndViolationTypeOrderByDetectedAtDesc(Long playerId, AntiCheatViolationType violationType);

    Optional<AntiCheatEvent> findTopByPlayerIdOrderByDetectedAtDesc(Long playerId);

    long countByPlayerIdAndViolationTypeAndDetectedAtAfter(Long playerId, AntiCheatViolationType violationType, Instant after);

    long countByPlayerIdAndDetectedAtAfter(Long playerId, Instant after);

    Optional<AntiCheatEvent> findByIncidentKey(String incidentKey);
}
