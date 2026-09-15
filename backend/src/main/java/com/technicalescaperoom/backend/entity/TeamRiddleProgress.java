package com.technicalescaperoom.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "team_riddle_progress",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_team_riddle", columnNames = {"team_id", "riddle_index"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamRiddleProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "riddle_index", nullable = false)
    private Integer riddleIndex;

    @Column(name = "is_solved", nullable = false)
    @Builder.Default
    private Boolean isSolved = false;

    @Column(name = "solved_digit", length = 10)
    private String solvedDigit;

    @Column(name = "solved_at")
    private Instant solvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solved_by_player_id")
    private Player solvedByPlayer;

    @Column(name = "wrong_attempts", nullable = false)
    @Builder.Default
    private Integer wrongAttempts = 0;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
