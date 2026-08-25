package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamLevelProgressRepository extends JpaRepository<TeamLevelProgress, Long> {
    List<TeamLevelProgress> findByTeamIdOrderByLevelIdAsc(Long teamId);
    Optional<TeamLevelProgress> findByTeamIdAndLevelId(Long teamId, Long levelId);
}
