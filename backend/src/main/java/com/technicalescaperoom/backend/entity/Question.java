package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.AnswerType;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @Column(name = "stage_number", nullable = false)
    @Builder.Default
    private Integer stageNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "player_number", nullable = false, length = 20)
    private QuestionPlayer playerNumber;

    @Column(name = "evidence", nullable = false, columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "puzzle_context", length = 255)
    private String puzzleContext;

    @Column(name = "technical_category", length = 100)
    private String technicalCategory;

    @Column(name = "difficulty", length = 50)
    private String difficulty;

    @Column(name = "validation_rules", columnDefinition = "TEXT")
    private String validationRules;

    @Column(name = "puzzle_metadata", columnDefinition = "TEXT")
    private String puzzleMetadata;

    @Column(name = "expected_answer_hash", nullable = false)
    private String expectedAnswerHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_type", nullable = false, length = 50)
    @Builder.Default
    private AnswerType answerType = AnswerType.TEXT;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
