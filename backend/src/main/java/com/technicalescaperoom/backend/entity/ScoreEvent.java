package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.ScoreEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "score_events",
    indexes = {
        @Index(name = "idx_score_events_team", columnList = "team_id"),
        @Index(name = "idx_score_events_ref", columnList = "team_id, reference_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_score_events_team_ref", columnNames = {"team_id", "reference_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private ScoreEventType eventType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "points_delta", nullable = false)
    private Integer pointsDelta;

    @Column(name = "reason", length = 255)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
