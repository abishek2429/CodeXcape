package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamStageProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamStageProgressRepository extends JpaRepository<TeamStageProgress, Long> {
    List<TeamStageProgress> findByTeamIdAndLevelIdOrderByStageNumberAsc(Long teamId, Long levelId);
    Optional<TeamStageProgress> findByTeamIdAndLevelIdAndStageNumber(Long teamId, Long levelId, Integer stageNumber);
}
