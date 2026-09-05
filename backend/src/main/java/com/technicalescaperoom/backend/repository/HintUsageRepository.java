package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.HintUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HintUsageRepository extends JpaRepository<HintUsage, Long> {
    boolean existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(Long teamId, Long levelId, Integer stageNumber, Integer hintNumber);
    long countByTeamIdAndLevelIdAndStageNumber(Long teamId, Long levelId, Integer stageNumber);
}
