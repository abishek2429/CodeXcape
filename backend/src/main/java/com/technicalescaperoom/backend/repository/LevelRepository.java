package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LevelRepository extends JpaRepository<Level, Long> {
    Optional<Level> findByLevelNumber(Integer levelNumber);
    List<Level> findByIsActiveTrueOrderByLevelNumberAsc();
}
