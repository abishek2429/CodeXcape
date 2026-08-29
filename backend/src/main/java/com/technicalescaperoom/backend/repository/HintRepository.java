package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Hint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HintRepository extends JpaRepository<Hint, Long> {
    Optional<Hint> findByLevelIdAndIsActiveTrue(Long levelId);
    java.util.List<Hint> findByLevelIdOrderByDisplayOrderAsc(Long levelId);
}
