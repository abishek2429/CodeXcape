package com.technicalescaperoom.backend.entity;

import com.technicalescaperoom.backend.enums.StoryProgressStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "team_story_progress",
    indexes = {
        @Index(name = "idx_team_story_progress_team", columnList = "team_id"),
        @Index(name = "idx_team_story_progress_status", columnList = "team_id, status")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_team_story_progress", columnNames = {"team_id", "story_key"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamStoryProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "story_key", nullable = false, length = 50)
    private String storyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StoryProgressStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "pause_duration_seconds", nullable = false)
    @Builder.Default
    private Long pauseDurationSeconds = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
