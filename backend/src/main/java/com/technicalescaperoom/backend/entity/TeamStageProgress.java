package com.technicalescaperoom.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "team_stage_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uq_team_stage_progress", columnNames = {"team_id", "level_id", "stage_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamStageProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @Column(name = "stage_number", nullable = false)
    private Integer stageNumber;

    @Column(name = "player1_completed", nullable = false)
    @Builder.Default
    private Boolean player1Completed = false;

    @Column(name = "player2_completed", nullable = false)
    @Builder.Default
    private Boolean player2Completed = false;

    @Column(name = "discovery_key", nullable = false, length = 100)
    private String discoveryKey;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
