package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamAntiCheatSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamAntiCheatSummaryRepository extends JpaRepository<TeamAntiCheatSummary, Long> {

    Optional<TeamAntiCheatSummary> findByTeamId(Long teamId);

    List<TeamAntiCheatSummary> findByTeamIdIn(List<Long> teamIds);

    @Query("SELECT s FROM TeamAntiCheatSummary s WHERE s.team.event.id = :eventId ORDER BY s.totalPenaltyPoints DESC")
    List<TeamAntiCheatSummary> findByEventIdOrderByTotalPenaltyPointsDesc(@Param("eventId") Long eventId);
}
