package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamStoryProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamStoryProgressRepository extends JpaRepository<TeamStoryProgress, Long> {
    Optional<TeamStoryProgress> findByTeamIdAndStoryKey(Long teamId, String storyKey);
    boolean existsByTeamIdAndStoryKey(Long teamId, String storyKey);
    List<TeamStoryProgress> findByTeamIdOrderByStartedAtAsc(Long teamId);
}
