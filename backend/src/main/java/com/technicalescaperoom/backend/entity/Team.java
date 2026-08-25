package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "teams",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_teams_event_team_code", columnNames = {"event_id", "team_code"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "team_code", nullable = false, length = 50)
    private String teamCode;

    @Column(name = "team_name", length = 100)
    private String teamName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private TeamStatus status = TeamStatus.REGISTERED;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_state", nullable = false, length = 50)
    @Builder.Default
    private TeamGameState gameState = TeamGameState.NOT_STARTED;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
