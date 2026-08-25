package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamId(Long teamId);
    Optional<Player> findByTeamIdAndPlayerNumber(Long teamId, Integer playerNumber);
    long countByTeamId(Long teamId);
    void deleteByTeamId(Long teamId);
}
