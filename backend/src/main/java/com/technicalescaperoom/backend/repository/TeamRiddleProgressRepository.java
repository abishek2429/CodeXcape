package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamRiddleProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRiddleProgressRepository extends JpaRepository<TeamRiddleProgress, Long> {

    List<TeamRiddleProgress> findByTeamIdOrderByRiddleIndexAsc(Long teamId);

    Optional<TeamRiddleProgress> findByTeamIdAndRiddleIndex(Long teamId, Integer riddleIndex);
}
