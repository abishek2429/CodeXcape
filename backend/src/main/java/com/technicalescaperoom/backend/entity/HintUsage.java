package com.technicalescaperoom.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "hint_usage", uniqueConstraints = {
        @UniqueConstraint(name = "uq_hint_usage", columnNames = {"team_id", "level_id", "stage_number", "hint_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HintUsage {
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

    @Column(name = "hint_number", nullable = false)
    private Integer hintNumber;

    @Column(name = "used_at", nullable = false)
    @Builder.Default
    private Instant usedAt = Instant.now();
}
