package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "anti_cheat_events",
    indexes = {
        @Index(name = "idx_anti_cheat_team", columnList = "team_id"),
        @Index(name = "idx_anti_cheat_player", columnList = "player_id"),
        @Index(name = "idx_anti_cheat_event", columnList = "event_id"),
        @Index(name = "idx_anti_cheat_team_detected", columnList = "team_id, detected_at"),
        @Index(name = "idx_anti_cheat_incident_key", columnList = "incident_key")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AntiCheatEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", nullable = false, length = 50)
    private AntiCheatViolationType violationType;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "penalty_points", nullable = false)
    private Integer penaltyPoints;

    @Column(name = "incident_key", length = 100)
    private String incidentKey;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
