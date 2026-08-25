package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByEventIdAndTeamCode(Long eventId, String teamCode);
    Optional<Team> findByTeamCode(String teamCode);
    boolean existsByEventIdAndTeamCode(Long eventId, String teamCode);
    java.util.List<Team> findByEventId(Long eventId);
    long countByEventId(Long eventId);
}
