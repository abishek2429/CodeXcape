package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.LevelStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "team_level_progress",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_team_level_progress", columnNames = {"team_id", "level_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamLevelProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @Column(name = "player1_completed", nullable = false)
    @Builder.Default
    private Boolean player1Completed = false;

    @Column(name = "player2_completed", nullable = false)
    @Builder.Default
    private Boolean player2Completed = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "level_status", nullable = false, length = 50)
    @Builder.Default
    private LevelStatus levelStatus = LevelStatus.LOCKED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
