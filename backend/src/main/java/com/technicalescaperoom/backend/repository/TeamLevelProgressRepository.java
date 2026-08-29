package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamLevelProgressRepository extends JpaRepository<TeamLevelProgress, Long> {
    List<TeamLevelProgress> findByTeamIdOrderByLevelIdAsc(Long teamId);
    Optional<TeamLevelProgress> findByTeamIdAndLevelId(Long teamId, Long levelId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tlp FROM TeamLevelProgress tlp WHERE tlp.team.id = :teamId AND tlp.level.id = :levelId")
    Optional<TeamLevelProgress> findForUpdateByTeamIdAndLevelId(@Param("teamId") Long teamId, @Param("levelId") Long levelId);
}
