package com.technicalescaperoom.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "team_anti_cheat_summary",
    indexes = {
        @Index(name = "idx_team_anti_cheat_summary_penalties", columnList = "total_penalty_points")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamAntiCheatSummary {

    @Id
    @Column(name = "team_id")
    private Long teamId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "total_penalty_points", nullable = false)
    @Builder.Default
    private Integer totalPenaltyPoints = 0;

    @Column(name = "total_violations", nullable = false)
    @Builder.Default
    private Integer totalViolations = 0;

    @Column(name = "tab_switch_count", nullable = false)
    @Builder.Default
    private Integer tabSwitchCount = 0;

    @Column(name = "fullscreen_exit_count", nullable = false)
    @Builder.Default
    private Integer fullscreenExitCount = 0;

    @Column(name = "prolonged_hidden_count", nullable = false)
    @Builder.Default
    private Integer prolongedHiddenCount = 0;

    @Column(name = "last_violation_at")
    private Instant lastViolationAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
