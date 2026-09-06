package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Hint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HintRepository extends JpaRepository<Hint, Long> {
    Optional<Hint> findFirstByLevelIdAndIsActiveTrueOrderByDisplayOrderAsc(Long levelId);
    default Optional<Hint> findByLevelIdAndIsActiveTrue(Long levelId) {
        return findFirstByLevelIdAndIsActiveTrueOrderByDisplayOrderAsc(levelId);
    }
    java.util.List<Hint> findByLevelIdOrderByDisplayOrderAsc(Long levelId);
    java.util.List<Hint> findByLevelIdAndStageNumberOrderByDisplayOrderAsc(Long levelId, Integer stageNumber);
}
