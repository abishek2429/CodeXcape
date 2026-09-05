package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.AnswerAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerAttemptRepository extends JpaRepository<AnswerAttempt, Long> {
    List<AnswerAttempt> findByTeamId(Long teamId);
    List<AnswerAttempt> findByTeamIdAndPlayerIdAndLevelId(Long teamId, Long playerId, Long levelId);
    long countByTeamIdAndPlayerIdAndLevelIdAndQuestionId(Long teamId, Long playerId, Long levelId, Long questionId);
    boolean existsByTeamIdAndPlayerIdAndLevelIdAndQuestionIdAndIsCorrectTrue(
            Long teamId, Long playerId, Long levelId, Long questionId);
    void deleteByTeamId(Long teamId);
}
