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

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "base_score", nullable = false)
    @Builder.Default
    private Integer baseScore = 0;

    @Column(name = "wrong_attempt_penalty", nullable = false)
    @Builder.Default
    private Integer wrongAttemptPenalty = 0;

    @Column(name = "hint_penalty", nullable = false)
    @Builder.Default
    private Integer hintPenalty = 0;

    @Column(name = "anti_cheat_penalty", nullable = false)
    @Builder.Default
    private Integer antiCheatPenalty = 0;

    @Column(name = "final_score", nullable = false)
    @Builder.Default
    private Integer finalScore = 0;

    @Column(name = "completed_mini_games", nullable = false)
    @Builder.Default
    private Integer completedMiniGames = 0;

    @Column(name = "completed_levels", nullable = false)
    @Builder.Default
    private Integer completedLevels = 0;

    @Column(name = "is_flagged_for_review", nullable = false)
    @Builder.Default
    private Boolean isFlaggedForReview = false;

    @Column(name = "security_incident_count", nullable = false)
    @Builder.Default
    private Integer securityIncidentCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
