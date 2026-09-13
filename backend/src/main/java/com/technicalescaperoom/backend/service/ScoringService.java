package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.ScoringConfig;
import com.technicalescaperoom.backend.dto.admin.ScoreEventDto;
import com.technicalescaperoom.backend.dto.player.TeamScoreDto;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.ScoreEvent;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import com.technicalescaperoom.backend.enums.ScoreEventType;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.ScoreEventRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final ScoreEventRepository scoreEventRepository;
    private final ScoringConfig scoringConfig;
    private final GameWebSocketPublisher webSocketPublisher;
    private final LeaderboardService leaderboardService;

    @Transactional
    public void recordMiniGameCompletion(Long teamId, int levelNumber, int stageNumber) {
        String referenceId = "MINI_GAME_L" + levelNumber + "_S" + stageNumber;
        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            log.info("Mini-game completion already scored for Team {} (Ref: {}). Idempotently skipping.", teamId, referenceId);
            return;
        }

        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            return;
        }

        int points = scoringConfig.getPointsForMiniGame(levelNumber);
        team.setBaseScore(team.getBaseScore() + points);
        team.setCompletedMiniGames(team.getCompletedMiniGames() + 1);

        recomputeFinalScore(team);

        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .eventType(ScoreEventType.MINI_GAME_COMPLETED)
                .referenceId(referenceId)
                .pointsDelta(points)
                .reason(String.format("Completed Level %d Mini-Game %d (+%d pts)", levelNumber, stageNumber, points))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.info("Base score awarded to Team {}: +{} pts for Level {} Mini-Game {}. New Base: {}, Final: {}",
                team.getTeamCode(), points, levelNumber, stageNumber, team.getBaseScore(), team.getFinalScore());

        broadcastScoreUpdate(team);
    }

    @Transactional
    public void recordWrongAttempt(Long teamId, Long playerId, int levelNumber, int stageNumber, Long attemptId) {
        String referenceId = "WRONG_ATTEMPT_" + attemptId;
        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            log.info("Wrong attempt penalty already recorded for attempt ID {}. Idempotently skipping.", attemptId);
            return;
        }

        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        Player player = (playerId != null) ? playerRepository.findById(playerId).orElse(null) : null;

        int penalty = ScoringConfig.WRONG_ATTEMPT_PENALTY;
        team.setWrongAttemptPenalty(team.getWrongAttemptPenalty() + penalty);

        recomputeFinalScore(team);

        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .player(player)
                .eventType(ScoreEventType.WRONG_ATTEMPT)
                .referenceId(referenceId)
                .pointsDelta(-penalty)
                .reason(String.format("Incorrect attempt on Level %d Mini-Game %d (-%d pts)", levelNumber, stageNumber, penalty))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.info("Wrong attempt penalty applied to Team {}: -{} pts. Total Wrong Penalty: {}, Final Score: {}",
                team.getTeamCode(), penalty, team.getWrongAttemptPenalty(), team.getFinalScore());

        broadcastScoreUpdate(team);
    }

    @Transactional
    public void recordHintUsage(Long teamId, Long playerId, int levelNumber, int stageNumber, int hintNumber) {
        String referenceId = "HINT_L" + levelNumber + "_S" + stageNumber + "_H" + hintNumber;
        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            log.info("Hint penalty already recorded for Team {} (Ref: {}). Idempotently skipping.", teamId, referenceId);
            return;
        }

        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            return;
        }

        Player player = (playerId != null) ? playerRepository.findById(playerId).orElse(null) : null;

        int penalty = scoringConfig.getPenaltyForHint(hintNumber);
        team.setHintPenalty(team.getHintPenalty() + penalty);

        recomputeFinalScore(team);

        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .player(player)
                .eventType(ScoreEventType.HINT_USED)
                .referenceId(referenceId)
                .pointsDelta(-penalty)
                .reason(String.format("Used Hint %d on Level %d Mini-Game %d (-%d pts)", hintNumber, levelNumber, stageNumber, penalty))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.info("Hint penalty applied to Team {}: -{} pts for Hint {}. Total Hint Penalty: {}, Final Score: {}",
                team.getTeamCode(), penalty, hintNumber, team.getHintPenalty(), team.getFinalScore());

        broadcastScoreUpdate(team);
    }

    @Transactional
    public void recordAntiCheatPenalty(Long teamId, Long playerId, AntiCheatViolationType violationType, int penaltyPoints, String incidentKey) {
        if (incidentKey != null && scoreEventRepository.existsByTeamIdAndReferenceId(teamId, incidentKey)) {
            log.info("Anti-cheat penalty already recorded for incident {} (Team {}). Idempotently skipping.", incidentKey, teamId);
            return;
        }

        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        if (incidentKey != null && scoreEventRepository.existsByTeamIdAndReferenceId(teamId, incidentKey)) {
            return;
        }

        Player player = (playerId != null) ? playerRepository.findById(playerId).orElse(null) : null;

        team.setAntiCheatPenalty(team.getAntiCheatPenalty() + penaltyPoints);

        recomputeFinalScore(team);

        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .player(player)
                .eventType(ScoreEventType.ANTI_CHEAT)
                .referenceId(incidentKey)
                .pointsDelta(-penaltyPoints)
                .reason(String.format("Anti-cheat violation: %s (-%d pts)", violationType.name(), penaltyPoints))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.info("Anti-cheat penalty applied to Team {}: -{} pts for {}. Total AC Penalty: {}, Final Score: {}",
                team.getTeamCode(), penaltyPoints, violationType.name(), team.getAntiCheatPenalty(), team.getFinalScore());

        broadcastScoreUpdate(team);
    }

    @Transactional
    public void recordFinalProtocolCompletion(Long teamId) {
        recordFinalProtocolCompletion(teamId, null);
    }

    @Transactional
    public void recordFinalProtocolCompletion(Long teamId, Long playerId) {
        String referenceId = "FINAL_PROTOCOL";
        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            log.info("Final Protocol already scored for Team {}. Idempotently skipping.", teamId);
            return;
        }

        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        if (scoreEventRepository.existsByTeamIdAndReferenceId(teamId, referenceId)) {
            return;
        }

        Player player = (playerId != null) ? playerRepository.findById(playerId).orElse(null) : null;

        int points = ScoringConfig.FINAL_PROTOCOL_POINTS;
        team.setBaseScore(team.getBaseScore() + points);

        recomputeFinalScore(team);

        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .player(player)
                .eventType(ScoreEventType.FINAL_PROTOCOL_COMPLETED)
                .referenceId(referenceId)
                .pointsDelta(points)
                .reason(String.format("Final Protocol Master Passkey Verified (+%d pts)", points))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.info("Final Protocol points awarded to Team {}: +{} pts! Final Base Score: {}, Final Competitive Score: {}",
                team.getTeamCode(), points, team.getBaseScore(), team.getFinalScore());

        broadcastScoreUpdate(team);
    }

    @Transactional
    public void recordSecurityIncident(Long teamId, Long playerId, String incidentType, String details) {
        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        Player player = (playerId != null) ? playerRepository.findById(playerId).orElse(null) : null;

        team.setIsFlaggedForReview(true);
        team.setSecurityIncidentCount(team.getSecurityIncidentCount() + 1);

        String referenceId = "SEC_" + System.currentTimeMillis();
        ScoreEvent event = ScoreEvent.builder()
                .team(team)
                .player(player)
                .eventType(ScoreEventType.SECURITY_INCIDENT)
                .referenceId(referenceId)
                .pointsDelta(0)
                .reason(String.format("SECURITY INCIDENT: %s (%s)", incidentType, details))
                .build();
        scoreEventRepository.save(event);
        teamRepository.saveAndFlush(team);

        log.warn("🚨 SECURITY INCIDENT for Team {}: {} - {}", team.getTeamCode(), incidentType, details);
    }

    @Transactional(readOnly = true)
    public TeamScoreDto getTeamScoreSummary(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + teamId));

        Integer currentRank = leaderboardService.getTeamCurrentRank(teamId);

        return TeamScoreDto.builder()
                .teamId(team.getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .baseScore(team.getBaseScore())
                .wrongAttemptPenalty(team.getWrongAttemptPenalty())
                .hintPenalty(team.getHintPenalty())
                .antiCheatPenalty(team.getAntiCheatPenalty())
                .finalScore(team.getFinalScore())
                .completedMiniGames(team.getCompletedMiniGames())
                .totalMiniGames(ScoringConfig.TOTAL_MINI_GAMES)
                .completedLevels(team.getCompletedLevels())
                .totalLevels(ScoringConfig.TOTAL_LEVELS)
                .currentRank(currentRank)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ScoreEventDto> getTeamScoreEvents(Long teamId) {
        return scoreEventRepository.findByTeamIdOrderByCreatedAtDesc(teamId).stream()
                .map(e -> ScoreEventDto.builder()
                        .id(e.getId())
                        .teamId(e.getTeam().getId())
                        .playerId(e.getPlayer() != null ? e.getPlayer().getId() : null)
                        .playerNumber(e.getPlayer() != null ? e.getPlayer().getPlayerNumber() : null)
                        .playerName(e.getPlayer() != null ? e.getPlayer().getDisplayName() : null)
                        .eventType(e.getEventType())
                        .referenceId(e.getReferenceId())
                        .pointsDelta(e.getPointsDelta())
                        .reason(e.getReason())
                        .createdAt(e.getCreatedAt())
                        .build())
                .toList();
    }

    private void recomputeFinalScore(Team team) {
        int rawScore = team.getBaseScore()
                - team.getWrongAttemptPenalty()
                - team.getHintPenalty()
                - team.getAntiCheatPenalty();
        team.setFinalScore(Math.max(0, rawScore));
    }

    private void broadcastScoreUpdate(Team team) {
        if (team.getEvent() != null) {
            leaderboardService.recalculateAndBroadcastRanks(team.getEvent().getId(), webSocketPublisher);
        }
        Integer rank = leaderboardService.getTeamCurrentRank(team.getId());
        TeamScoreDto summary = TeamScoreDto.builder()
                .teamId(team.getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .baseScore(team.getBaseScore())
                .wrongAttemptPenalty(team.getWrongAttemptPenalty())
                .hintPenalty(team.getHintPenalty())
                .antiCheatPenalty(team.getAntiCheatPenalty())
                .finalScore(team.getFinalScore())
                .completedMiniGames(team.getCompletedMiniGames())
                .totalMiniGames(ScoringConfig.TOTAL_MINI_GAMES)
                .completedLevels(team.getCompletedLevels())
                .totalLevels(ScoringConfig.TOTAL_LEVELS)
                .currentRank(rank)
                .build();
        webSocketPublisher.notifyTeamScoreChanged(team.getId(), summary);
    }
}
