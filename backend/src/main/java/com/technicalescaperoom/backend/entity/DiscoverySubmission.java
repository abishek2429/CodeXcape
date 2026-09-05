package com.technicalescaperoom.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "discovery_submissions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_discovery_submission", columnNames = {"team_id", "level_id", "stage_number", "player_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscoverySubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(name = "stage_number", nullable = false)
    private Integer stageNumber;

    @Column(name = "discovery_value_hash", nullable = false, length = 128)
    private String discoveryValueHash;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;
}
