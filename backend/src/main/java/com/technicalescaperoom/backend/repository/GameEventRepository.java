package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.GameEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameEventRepository extends JpaRepository<GameEvent, Long> {
    List<GameEvent> findByTeamIdOrderByTimestampDesc(Long teamId);
}
