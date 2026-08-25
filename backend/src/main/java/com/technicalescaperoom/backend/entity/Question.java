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

    @Enumerated(EnumType.STRING)
    @Column(name = "player_number", nullable = false, length = 20)
    private QuestionPlayer playerNumber;

    @Column(name = "question_content", nullable = false, columnDefinition = "TEXT")
    private String questionContent;

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
