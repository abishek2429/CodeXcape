package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamId(Long teamId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Player p WHERE p.team.id IN :teamIds")
    List<Player> findByTeamIdIn(@org.springframework.data.repository.query.Param("teamIds") java.util.Collection<Long> teamIds);

    Optional<Player> findByTeamIdAndPlayerNumber(Long teamId, Integer playerNumber);
    long countByTeamId(Long teamId);
    void deleteByTeamId(Long teamId);
}
