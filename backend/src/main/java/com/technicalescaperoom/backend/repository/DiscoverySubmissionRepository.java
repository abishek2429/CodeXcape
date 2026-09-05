package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.DiscoverySubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscoverySubmissionRepository extends JpaRepository<DiscoverySubmission, Long> {
    Optional<DiscoverySubmission> findByTeamIdAndLevelIdAndStageNumberAndPlayerId(Long teamId, Long levelId, Integer stageNumber, Long playerId);
}
