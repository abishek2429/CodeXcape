package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.StorySequenceConfig;
import com.technicalescaperoom.backend.dto.story.ActiveStoryStateDto;
import com.technicalescaperoom.backend.dto.story.StorySequenceDto;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamStoryProgress;
import com.technicalescaperoom.backend.enums.StoryProgressStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.repository.TeamStoryProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CinematicStoryService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamStoryProgressRepository teamStoryProgressRepository;
    private final StorySequenceConfig storySequenceConfig;
    private final GameWebSocketPublisher webSocketPublisher;

    @Transactional
    public ActiveStoryStateDto triggerStory(Long teamId, String storyKey) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        return triggerStory(team, storyKey);
    }

    @Transactional
    public ActiveStoryStateDto triggerStory(Team team, String storyKey) {
        if (team == null || storyKey == null) {
            return null;
        }

        // Idempotency: Has this story already been completed or skipped by this team?
        if (teamStoryProgressRepository.existsByTeamIdAndStoryKey(team.getId(), storyKey)) {
            log.debug("Story sequence {} already resolved for Team {}, ignoring duplicate trigger", storyKey, team.getTeamCode());
            return buildActiveState(team);
        }

        // Check if this exact story is already currently active
        if (storyKey.equals(team.getCurrentStoryKey())) {
            log.debug("Story sequence {} is already active for Team {}", storyKey, team.getTeamCode());
            return buildActiveState(team);
        }

        Optional<StorySequenceDto> seqOpt = storySequenceConfig.getSequence(storyKey);
        if (seqOpt.isEmpty()) {
            log.warn("Unknown story sequence key requested: {}", storyKey);
            return buildActiveState(team);
        }

        Instant now = Instant.now();
        team.setCurrentStoryKey(storyKey);
        team.setStoryPausedAt(now);
        teamRepository.save(team);

        TeamStoryProgress progress = TeamStoryProgress.builder()
                .team(team)
                .storyKey(storyKey)
                .status(StoryProgressStatus.ACTIVE)
                .startedAt(now)
                .pauseDurationSeconds(0L)
                .build();
        teamStoryProgressRepository.save(progress);

        ActiveStoryStateDto state = buildActiveState(team);
        log.info("▶ Story sequence [{}] triggered for Team {} (Timer PAUSED at {})", storyKey, team.getTeamCode(), now);
        webSocketPublisher.notifyStoryStarted(team.getId(), storyKey, state);

        return state;
    }

    @Transactional
    public ActiveStoryStateDto skipStory(Long teamId, Long playerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        if (!team.isStoryActive()) {
            log.debug("No active story to skip for Team {}", team.getTeamCode());
            return buildActiveState(team);
        }

        String storyKey = team.getCurrentStoryKey();
        Instant pausedAt = team.getStoryPausedAt();
        Instant now = Instant.now();

        long pauseDuration = (pausedAt != null) ? Math.max(0, Duration.between(pausedAt, now).getSeconds()) : 0L;
        team.setTotalStoryPauseSeconds(team.getTotalStoryPauseSeconds() + pauseDuration);
        team.setCurrentStoryKey(null);
        team.setStoryPausedAt(null);
        teamRepository.save(team);

        Optional<TeamStoryProgress> progOpt = teamStoryProgressRepository.findByTeamIdAndStoryKey(teamId, storyKey);
        if (progOpt.isPresent()) {
            TeamStoryProgress prog = progOpt.get();
            prog.setStatus(StoryProgressStatus.SKIPPED);
            prog.setEndedAt(now);
            prog.setPauseDurationSeconds(pauseDuration);
            teamStoryProgressRepository.save(prog);
        }

        Integer playerNum = null;
        if (playerId != null) {
            playerNum = playerRepository.findById(playerId).map(Player::getPlayerNumber).orElse(null);
        }

        ActiveStoryStateDto state = buildActiveState(team);
        log.info("⏩ Story sequence [{}] SKIPPED for Team {} by Operator {} (Paused for {}s, Timer RESUMED)",
                storyKey, team.getTeamCode(), (playerNum != null ? playerNum : "Unknown"), pauseDuration);

        webSocketPublisher.notifyStorySkipped(teamId, playerId, playerNum, storyKey, state);
        return state;
    }

    @Transactional
    public ActiveStoryStateDto completeStory(Long teamId, Long playerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        if (!team.isStoryActive()) {
            log.debug("No active story to complete for Team {}", team.getTeamCode());
            return buildActiveState(team);
        }

        String storyKey = team.getCurrentStoryKey();
        Instant pausedAt = team.getStoryPausedAt();
        Instant now = Instant.now();

        long pauseDuration = (pausedAt != null) ? Math.max(0, Duration.between(pausedAt, now).getSeconds()) : 0L;
        team.setTotalStoryPauseSeconds(team.getTotalStoryPauseSeconds() + pauseDuration);
        team.setCurrentStoryKey(null);
        team.setStoryPausedAt(null);
        teamRepository.save(team);

        Optional<TeamStoryProgress> progOpt = teamStoryProgressRepository.findByTeamIdAndStoryKey(teamId, storyKey);
        if (progOpt.isPresent()) {
            TeamStoryProgress prog = progOpt.get();
            prog.setStatus(StoryProgressStatus.COMPLETED);
            prog.setEndedAt(now);
            prog.setPauseDurationSeconds(pauseDuration);
            teamStoryProgressRepository.save(prog);
        }

        Integer playerNum = null;
        if (playerId != null) {
            playerNum = playerRepository.findById(playerId).map(Player::getPlayerNumber).orElse(null);
        }

        ActiveStoryStateDto state = buildActiveState(team);
        log.info("✔ Story sequence [{}] COMPLETED for Team {} (Paused for {}s, Timer RESUMED)",
                storyKey, team.getTeamCode(), pauseDuration);

        webSocketPublisher.notifyStoryCompleted(teamId, playerId, playerNum, storyKey, state);

        // Chain Prologue directly into Level 1 Intro narrative if not yet resolved
        if ("STORY_PROLOGUE".equals(storyKey) && !teamStoryProgressRepository.existsByTeamIdAndStoryKey(teamId, "STORY_L1_INTRO")) {
            return triggerStory(team, "STORY_L1_INTRO");
        }

        return state;
    }

    @Transactional
    public ActiveStoryStateDto replayStory(Long teamId, String storyKey) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        if (storyKey == null) {
            return buildActiveState(team);
        }

        Optional<StorySequenceDto> seqOpt = storySequenceConfig.getSequence(storyKey);
        if (seqOpt.isEmpty()) {
            log.warn("Unknown story sequence key for replay: {}", storyKey);
            return buildActiveState(team);
        }

        Instant now = Instant.now();
        team.setCurrentStoryKey(storyKey);
        team.setStoryPausedAt(now);
        teamRepository.save(team);

        ActiveStoryStateDto state = buildActiveState(team);
        log.info("▶ Replaying story sequence [{}] for Team {}", storyKey, team.getTeamCode());
        webSocketPublisher.notifyStoryStarted(team.getId(), storyKey, state);
        return state;
    }

    @Transactional(readOnly = true)
    public ActiveStoryStateDto getCurrentStoryState(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        return buildActiveState(team);
    }

    @Transactional(readOnly = true)
    public List<String> getResolvedStoryKeys(Long teamId) {
        return teamStoryProgressRepository.findByTeamIdOrderByStartedAtAsc(teamId).stream()
                .map(TeamStoryProgress::getStoryKey)
                .collect(Collectors.toList());
    }

    public long calculateEffectiveActiveDuration(Team team) {
        Instant startTime = (team.getStartedAt() != null) ? team.getStartedAt() : team.getCreatedAt();
        Instant endTime = (team.getCompletedAt() != null) ? team.getCompletedAt() : Instant.now();
        if (startTime == null) return 0L;

        long grossSeconds = Math.max(0, Duration.between(startTime, endTime).getSeconds());
        long totalPauses = (team.getTotalStoryPauseSeconds() != null) ? team.getTotalStoryPauseSeconds() : 0L;

        long inFlightPause = 0L;
        if (team.isStoryActive() && team.getStoryPausedAt() != null && team.getCompletedAt() == null) {
            inFlightPause = Math.max(0, Duration.between(team.getStoryPausedAt(), Instant.now()).getSeconds());
        }

        return Math.max(0, grossSeconds - totalPauses - inFlightPause);
    }

    private ActiveStoryStateDto buildActiveState(Team team) {
        boolean active = team.isStoryActive();
        String currentKey = team.getCurrentStoryKey();
        Instant pausedAt = team.getStoryPausedAt();

        Long currentPause = null;
        if (active && pausedAt != null) {
            currentPause = Math.max(0, Duration.between(pausedAt, Instant.now()).getSeconds());
        }

        StorySequenceDto seq = null;
        if (active && currentKey != null) {
            seq = storySequenceConfig.getSequence(currentKey).orElse(null);
        }

        List<String> resolvedKeys = teamStoryProgressRepository.findByTeamIdOrderByStartedAtAsc(team.getId()).stream()
                .filter(p -> p.getStatus() == StoryProgressStatus.COMPLETED || p.getStatus() == StoryProgressStatus.SKIPPED)
                .map(TeamStoryProgress::getStoryKey)
                .collect(Collectors.toList());

        return ActiveStoryStateDto.builder()
                .isStoryActive(active)
                .storyKey(currentKey)
                .storyPausedAt(pausedAt)
                .currentPauseSeconds(currentPause)
                .totalStoryPauseSeconds(team.getTotalStoryPauseSeconds() != null ? team.getTotalStoryPauseSeconds() : 0L)
                .effectiveActiveDurationSeconds(calculateEffectiveActiveDuration(team))
                .sequence(seq)
                .completedStoryKeys(resolvedKeys)
                .build();
    }
}
