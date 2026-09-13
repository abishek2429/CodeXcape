package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.admin.AntiCheatEventAuditDto;
import com.technicalescaperoom.backend.dto.admin.AntiCheatSummaryDto;
import com.technicalescaperoom.backend.dto.player.AntiCheatEventResponseDto;
import com.technicalescaperoom.backend.dto.player.AntiCheatReportRequest;
import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.AntiCheatViolationType;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.EventUnavailableException;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.*;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AntiCheatService {

    private final AntiCheatEventRepository antiCheatEventRepository;
    private final TeamAntiCheatSummaryRepository teamAntiCheatSummaryRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final AuditService auditService;
    private final GameWebSocketPublisher webSocketPublisher;
    private final LeaderboardService leaderboardService;

    @Value("${codexcape.anticheat.tab-switch-penalty:10}")
    private int tabSwitchPenalty = 10;

    @Value("${codexcape.anticheat.fullscreen-exit-penalty:15}")
    private int fullscreenExitPenalty = 15;

    @Value("${codexcape.anticheat.prolonged-hidden-penalty:15}")
    private int prolongedHiddenPenalty = 15;

    @Value("${codexcape.anticheat.cooldown-seconds:10}")
    private int cooldownSeconds = 10;

    @Value("${codexcape.anticheat.correlation-window-seconds:5}")
    private int correlationWindowSeconds = 5;

    @Value("${codexcape.anticheat.prolonged-threshold-seconds:30}")
    private int prolongedThresholdSeconds = 30;

    // Track when player tab was hidden to compute duration and detect prolonged absence
    private final Map<Long, Instant> playerHiddenStartTime = new ConcurrentHashMap<>();
    // Track recent violations for high-speed deduplication
    private final Map<String, Instant> recentViolationCache = new ConcurrentHashMap<>();

    @Transactional
    public AntiCheatEventResponseDto processPlayerEvent(PlayerPrincipal principal, AntiCheatReportRequest request) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID: " + principal.getTeamId()));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found for ID: " + principal.getPlayerId()));

        if (!player.getTeam().getId().equals(team.getId())) {
            throw new ResourceNotFoundException("Player does not belong to specified team.");
        }

        Event event = team.getEvent();

        // 1. ACTIVE GAME ONLY: Only actively penalize during competitive IN_PROGRESS gameplay
        if (team.getGameState() != TeamGameState.IN_PROGRESS) {
            log.debug("Anti-cheat event ignored: Team {} is in {} state (only IN_PROGRESS is penalized).",
                    team.getTeamCode(), team.getGameState());
            return AntiCheatEventResponseDto.builder()
                    .accepted(false)
                    .deduplicated(false)
                    .message("Event ignored: Game is not actively in progress.")
                    .build();
        }

        if (event.getStatus() != EventStatus.RUNNING && event.getStatus() != EventStatus.READY) {
            log.debug("Anti-cheat event ignored: Event {} status is {}.", event.getName(), event.getStatus());
            return AntiCheatEventResponseDto.builder()
                    .accepted(false)
                    .deduplicated(false)
                    .message("Event ignored: Event is not running.")
                    .build();
        }

        String rawType = (request.getEventType() != null) ? request.getEventType().trim().toUpperCase() : "";
        Instant now = Instant.now();

        // 2. Handle recovery event (VISIBILITY_RESTORED / FOCUS_RESTORED)
        if ("VISIBILITY_RESTORED".equals(rawType) || "PAGE_VISIBLE".equals(rawType) || "FOCUS_RESTORED".equals(rawType)) {
            Instant hiddenSince = playerHiddenStartTime.remove(player.getId());
            if (hiddenSince != null) {
                long awaySeconds = Duration.between(hiddenSince, now).getSeconds();
                if (awaySeconds >= prolongedThresholdSeconds) {
                    log.warn("Player {} on Team {} was away for {}s (prolonged absence threshold: {}s).",
                            player.getDisplayName(), team.getTeamCode(), awaySeconds, prolongedThresholdSeconds);
                    return recordViolation(team, player, event, AntiCheatViolationType.PROLONGED_PAGE_HIDDEN,
                            awaySeconds * 1000L, now, "Prolonged background absence for " + awaySeconds + " seconds.");
                }
            }
            return AntiCheatEventResponseDto.builder()
                    .accepted(false)
                    .deduplicated(false)
                    .message("Visibility restored recorded. No penalty applied.")
                    .build();
        }

        // 3. Map raw event type to authoritative ViolationType
        AntiCheatViolationType violationType;
        if ("TAB_SWITCH".equals(rawType) || "PAGE_HIDDEN".equals(rawType) || "VISIBILITY_HIDDEN".equals(rawType)) {
            violationType = AntiCheatViolationType.TAB_SWITCH;
            playerHiddenStartTime.putIfAbsent(player.getId(), now);
        } else if ("FULLSCREEN_EXIT".equals(rawType) || "FULLSCREEN_CHANGE".equals(rawType)) {
            violationType = AntiCheatViolationType.FULLSCREEN_EXIT;
        } else if ("PROLONGED_PAGE_HIDDEN".equals(rawType)) {
            violationType = AntiCheatViolationType.PROLONGED_PAGE_HIDDEN;
        } else {
            log.debug("Ignored unmonitored anti-cheat event type '{}'", rawType);
            return AntiCheatEventResponseDto.builder()
                    .accepted(false)
                    .deduplicated(false)
                    .message("Ignored unrecognized event type.")
                    .build();
        }

        // 4. Server-Side Incident Deduplication & Correlation
        // A. Correlated incident: If player exited fullscreen and visibility hidden within correlation window (5s), correlate to 1 incident
        String correlationKey = "recent_fullscreen_" + player.getId();
        Instant lastFullscreen = recentViolationCache.get(correlationKey);
        if (violationType == AntiCheatViolationType.TAB_SWITCH && lastFullscreen != null) {
            if (Duration.between(lastFullscreen, now).getSeconds() < correlationWindowSeconds) {
                log.info("Correlating TAB_SWITCH with recent FULLSCREEN_EXIT for Player {} on Team {}. Deduplicated.",
                        player.getDisplayName(), team.getTeamCode());
                return AntiCheatEventResponseDto.builder()
                        .accepted(false)
                        .deduplicated(true)
                        .message("Correlated with recent fullscreen exit. Deduplicated.")
                        .build();
            }
        }

        // B. Cooldown deduplication: Do not issue repeated penalties of the same type within cooldownSeconds
        String cooldownKey = "cooldown_" + player.getId() + "_" + violationType.name();
        Instant lastViolation = recentViolationCache.get(cooldownKey);
        if (lastViolation != null && Duration.between(lastViolation, now).getSeconds() < cooldownSeconds) {
            log.info("Deduplicating rapid {} event for Player {} (cooldown: {}s).",
                    violationType, player.getDisplayName(), cooldownSeconds);
            return AntiCheatEventResponseDto.builder()
                    .accepted(false)
                    .deduplicated(true)
                    .violationType(violationType)
                    .message("Duplicate event within cooldown window. Deduplicated.")
                    .build();
        }

        // Record cooldown marker
        recentViolationCache.put(cooldownKey, now);
        if (violationType == AntiCheatViolationType.FULLSCREEN_EXIT) {
            recentViolationCache.put(correlationKey, now);
        }

        // 5. Authoritative Penalty Calculation & Recording
        return recordViolation(team, player, event, violationType, null, now, request.getMetadata());
    }

    private AntiCheatEventResponseDto recordViolation(Team team, Player player, Event event,
                                                      AntiCheatViolationType violationType,
                                                      Long durationMs, Instant detectedAt, String metadata) {
        int penaltyPoints = getPenaltyPointsForType(violationType);
        String incidentKey = "inc_" + team.getId() + "_p" + player.getPlayerNumber() + "_" + violationType.name() + "_" + (detectedAt.toEpochMilli() / (cooldownSeconds * 1000L));

        AntiCheatEvent auditRecord = AntiCheatEvent.builder()
                .team(team)
                .player(player)
                .event(event)
                .violationType(violationType)
                .detectedAt(detectedAt)
                .durationMs(durationMs)
                .penaltyPoints(penaltyPoints)
                .incidentKey(incidentKey)
                .metadata(metadata)
                .build();
        antiCheatEventRepository.save(auditRecord);

        // Update or create Team summary atomically
        TeamAntiCheatSummary summary = teamAntiCheatSummaryRepository.findByTeamId(team.getId())
                .orElseGet(() -> TeamAntiCheatSummary.builder()
                        .team(team)
                        .totalPenaltyPoints(0)
                        .totalViolations(0)
                        .tabSwitchCount(0)
                        .fullscreenExitCount(0)
                        .prolongedHiddenCount(0)
                        .build());

        summary.setTotalPenaltyPoints(summary.getTotalPenaltyPoints() + penaltyPoints);
        summary.setTotalViolations(summary.getTotalViolations() + 1);
        summary.setLastViolationAt(detectedAt);

        if (violationType == AntiCheatViolationType.TAB_SWITCH) {
            summary.setTabSwitchCount(summary.getTabSwitchCount() + 1);
        } else if (violationType == AntiCheatViolationType.FULLSCREEN_EXIT) {
            summary.setFullscreenExitCount(summary.getFullscreenExitCount() + 1);
        } else if (violationType == AntiCheatViolationType.PROLONGED_PAGE_HIDDEN) {
            summary.setProlongedHiddenCount(summary.getProlongedHiddenCount() + 1);
        }

        teamAntiCheatSummaryRepository.saveAndFlush(summary);

        log.warn("🚨 ANTI-CHEAT VIOLATION: Team {} | Player {} (P{}) | Type: {} | -{} pts | Team Total: -{} pts",
                team.getTeamCode(), player.getDisplayName(), player.getPlayerNumber(),
                violationType, penaltyPoints, summary.getTotalPenaltyPoints());

        // Audit Trail Log
        auditService.logEvent(
                GameEventType.ANTI_CHEAT_VIOLATION,
                event,
                team,
                player,
                String.format("{\"violationType\":\"%s\",\"penaltyPoints\":%d,\"teamTotal\":%d}",
                        violationType.name(), penaltyPoints, summary.getTotalPenaltyPoints()),
                "ANTI_CHEAT"
        );

        String violationLabel = formatViolationLabel(violationType);
        String alertMsg = String.format("ANTI-CHEAT ALERT: %s DETECTED (Player %d). Team Penalty: -%d pts (Team Total: -%d pts).",
                violationLabel, player.getPlayerNumber(), penaltyPoints, summary.getTotalPenaltyPoints());

        // Realtime WebSockets:
        // 1. Notify Team channel (/topic/team/{id}) with alert & team total
        webSocketPublisher.notifyTeamAntiCheatAlert(
                team.getId(),
                team.getTeamCode(),
                player.getPlayerNumber(),
                violationType.name(),
                penaltyPoints,
                summary.getTotalPenaltyPoints(),
                alertMsg
        );

        // 2. Notify Admin channel (/topic/admin) with full forensic event
        webSocketPublisher.notifyAdminAntiCheatEvent(
                team.getId(),
                team.getTeamCode(),
                player.getId(),
                player.getPlayerNumber(),
                player.getDisplayName(),
                violationType.name(),
                penaltyPoints,
                summary.getTotalPenaltyPoints(),
                summary.getTotalViolations(),
                alertMsg
        );

        // 3. Recalculate Leaderboard Ranks immediately
        leaderboardService.recalculateAndBroadcastRanks(event.getId(), webSocketPublisher);

        return AntiCheatEventResponseDto.builder()
                .accepted(true)
                .deduplicated(false)
                .incidentId(auditRecord.getId())
                .violationType(violationType)
                .penaltyPoints(penaltyPoints)
                .teamTotalPenalties(summary.getTotalPenaltyPoints())
                .message(alertMsg)
                .build();
    }

    private int getPenaltyPointsForType(AntiCheatViolationType type) {
        return switch (type) {
            case TAB_SWITCH -> tabSwitchPenalty;
            case FULLSCREEN_EXIT -> fullscreenExitPenalty;
            case PROLONGED_PAGE_HIDDEN -> prolongedHiddenPenalty;
        };
    }

    private String formatViolationLabel(AntiCheatViolationType type) {
        return switch (type) {
            case TAB_SWITCH -> "TAB SWITCH";
            case FULLSCREEN_EXIT -> "FULLSCREEN EXIT";
            case PROLONGED_PAGE_HIDDEN -> "PROLONGED INACTIVITY";
        };
    }

    @Transactional(readOnly = true)
    public AntiCheatSummaryDto getTeamSummary(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        TeamAntiCheatSummary summary = teamAntiCheatSummaryRepository.findByTeamId(teamId)
                .orElse(null);

        return AntiCheatSummaryDto.builder()
                .teamId(team.getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .totalPenaltyPoints(summary != null ? summary.getTotalPenaltyPoints() : 0)
                .totalViolations(summary != null ? summary.getTotalViolations() : 0)
                .tabSwitchCount(summary != null ? summary.getTabSwitchCount() : 0)
                .fullscreenExitCount(summary != null ? summary.getFullscreenExitCount() : 0)
                .prolongedHiddenCount(summary != null ? summary.getProlongedHiddenCount() : 0)
                .lastViolationAt(summary != null ? summary.getLastViolationAt() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AntiCheatSummaryDto> getEventSummaries(Long eventId) {
        List<Team> teams = teamRepository.findByEventId(eventId);
        if (teams.isEmpty()) return Collections.emptyList();

        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        Map<Long, TeamAntiCheatSummary> summaryMap = teamAntiCheatSummaryRepository.findByTeamIdIn(teamIds).stream()
                .collect(java.util.stream.Collectors.toMap(TeamAntiCheatSummary::getTeamId, s -> s));

        List<AntiCheatSummaryDto> dtos = new ArrayList<>();
        for (Team team : teams) {
            TeamAntiCheatSummary s = summaryMap.get(team.getId());
            dtos.add(AntiCheatSummaryDto.builder()
                    .teamId(team.getId())
                    .teamCode(team.getTeamCode())
                    .teamName(team.getTeamName())
                    .totalPenaltyPoints(s != null ? s.getTotalPenaltyPoints() : 0)
                    .totalViolations(s != null ? s.getTotalViolations() : 0)
                    .tabSwitchCount(s != null ? s.getTabSwitchCount() : 0)
                    .fullscreenExitCount(s != null ? s.getFullscreenExitCount() : 0)
                    .prolongedHiddenCount(s != null ? s.getProlongedHiddenCount() : 0)
                    .lastViolationAt(s != null ? s.getLastViolationAt() : null)
                    .build());
        }
        dtos.sort((a, b) -> Integer.compare(b.getTotalPenaltyPoints(), a.getTotalPenaltyPoints()));
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<AntiCheatEventAuditDto> getEventViolations(Long eventId) {
        List<AntiCheatEvent> events = antiCheatEventRepository.findByEventIdOrderByDetectedAtDesc(eventId);
        return events.stream().map(this::toAuditDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AntiCheatEventAuditDto> getTeamViolations(Long teamId) {
        List<AntiCheatEvent> events = antiCheatEventRepository.findByTeamIdOrderByDetectedAtDesc(teamId);
        return events.stream().map(this::toAuditDto).toList();
    }

    private AntiCheatEventAuditDto toAuditDto(AntiCheatEvent e) {
        return AntiCheatEventAuditDto.builder()
                .id(e.getId())
                .teamId(e.getTeam().getId())
                .teamCode(e.getTeam().getTeamCode())
                .teamName(e.getTeam().getTeamName())
                .playerId(e.getPlayer().getId())
                .playerName(e.getPlayer().getDisplayName())
                .playerNumber(e.getPlayer().getPlayerNumber())
                .violationType(e.getViolationType().name())
                .penaltyPoints(e.getPenaltyPoints())
                .durationMs(e.getDurationMs())
                .detectedAt(e.getDetectedAt())
                .metadata(e.getMetadata())
                .build();
    }
}
