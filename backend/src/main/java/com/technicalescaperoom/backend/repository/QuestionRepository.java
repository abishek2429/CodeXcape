package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByLevelId(Long levelId);
    Optional<Question> findByLevelIdAndPlayerNumberAndIsActiveTrue(Long levelId, QuestionPlayer playerNumber);
}
