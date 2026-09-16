const antiCheatEventRepository = require('../repositories/antiCheatEventRepository');
const teamAntiCheatSummaryRepository = require('../repositories/teamAntiCheatSummaryRepository');
const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const eventRepository = require('../repositories/eventRepository');
const auditService = require('./auditService');
const webSocketPublisher = require('./webSocketService');
const scoringService = require('./scoringService');
const leaderboardService = require('./admin/leaderboardService');

class AntiCheatService {
  constructor() {
    this.tabSwitchPenalty = 10;
    this.fullscreenExitPenalty = 15;
    this.prolongedHiddenPenalty = 15;
    this.cooldownSeconds = 10;
    this.correlationWindowSeconds = 5;
    this.prolongedThresholdSeconds = 30;

    this.playerHiddenStartTime = new Map();
    this.recentViolationCache = new Map();
  }

  async processPlayerEvent(principal, request) {
    if (!principal) {
      const err = new Error('No authenticated player session found.');
      err.status = 404;
      throw err;
    }

    const team = await teamRepository.findById(principal.teamId);
    if (!team) {
      const err = new Error(`Team not found for ID: ${principal.teamId}`);
      err.status = 404;
      throw err;
    }

    const player = await playerRepository.findById(principal.playerId);
    if (!player || player.teamId !== team.id) {
      const err = new Error('Player does not belong to specified team.');
      err.status = 404;
      throw err;
    }

    const event = await eventRepository.findById(team.eventId);

    // 1. ACTIVE GAME ONLY: Only actively penalize during competitive IN_PROGRESS gameplay
    if (team.gameState !== 'IN_PROGRESS') {
      return {
        accepted: false,
        deduplicated: false,
        message: 'Event ignored: Game is not actively in progress.'
      };
    }

    if (!event || (event.status !== 'RUNNING' && event.status !== 'READY')) {
      return {
        accepted: false,
        deduplicated: false,
        message: 'Event ignored: Event is not running.'
      };
    }

    const rawType = request.eventType ? String(request.eventType).trim().toUpperCase() : '';
    const now = Date.now();

    // 2. Handle recovery event (VISIBILITY_RESTORED / FOCUS_RESTORED)
    if (rawType === 'VISIBILITY_RESTORED' || rawType === 'PAGE_VISIBLE' || rawType === 'FOCUS_RESTORED') {
      const hiddenSince = this.playerHiddenStartTime.get(player.id);
      this.playerHiddenStartTime.delete(player.id);

      if (hiddenSince) {
        const awaySeconds = Math.floor((now - hiddenSince) / 1000);
        if (awaySeconds >= this.prolongedThresholdSeconds) {
          return await this._recordViolation(
            team,
            player,
            event,
            'PROLONGED_PAGE_HIDDEN',
            awaySeconds * 1000,
            new Date(now).toISOString(),
            `Prolonged background absence for ${awaySeconds} seconds.`
          );
        }
      }
      return {
        accepted: false,
        deduplicated: false,
        message: 'Visibility restored recorded. No penalty applied.'
      };
    }

    // 3. Map raw event type to authoritative ViolationType
    let violationType = null;
    if (rawType === 'TAB_SWITCH' || rawType === 'PAGE_HIDDEN' || rawType === 'VISIBILITY_HIDDEN') {
      violationType = 'TAB_SWITCH';
      if (!this.playerHiddenStartTime.has(player.id)) {
        this.playerHiddenStartTime.set(player.id, now);
      }
    } else if (rawType === 'FULLSCREEN_EXIT' || rawType === 'FULLSCREEN_CHANGE') {
      violationType = 'FULLSCREEN_EXIT';
    } else if (rawType === 'PROLONGED_PAGE_HIDDEN') {
      violationType = 'PROLONGED_PAGE_HIDDEN';
    } else {
      return {
        accepted: false,
        deduplicated: false,
        message: 'Ignored unrecognized event type.'
      };
    }

    // 4. Server-Side Incident Deduplication & Correlation
    // A. Correlated incident: If player exited fullscreen and visibility hidden within correlation window (5s)
    const correlationKey = `recent_fullscreen_${player.id}`;
    const lastFullscreen = this.recentViolationCache.get(correlationKey);
    if (violationType === 'TAB_SWITCH' && lastFullscreen) {
      if ((now - lastFullscreen) / 1000 < this.correlationWindowSeconds) {
        return {
          accepted: false,
          deduplicated: true,
          message: 'Correlated with recent fullscreen exit. Deduplicated.'
        };
      }
    }

    // B. Cooldown deduplication: Do not issue repeated penalties of the same type within cooldownSeconds
    const cooldownKey = `cooldown_${player.id}_${violationType}`;
    const lastViolation = this.recentViolationCache.get(cooldownKey);
    if (lastViolation && (now - lastViolation) / 1000 < this.cooldownSeconds) {
      return {
        accepted: false,
        deduplicated: true,
        violationType,
        message: 'Duplicate event within cooldown window. Deduplicated.'
      };
    }

    // Record cooldown marker
    this.recentViolationCache.set(cooldownKey, now);
    if (violationType === 'FULLSCREEN_EXIT') {
      this.recentViolationCache.set(correlationKey, now);
    }

    // 5. Authoritative Penalty Calculation & Recording
    return await this._recordViolation(
      team,
      player,
      event,
      violationType,
      0,
      new Date(now).toISOString(),
      request.metadata || null
    );
  }

  async _recordViolation(team, player, event, violationType, durationMs, detectedAt, metadata) {
    let summary = await teamAntiCheatSummaryRepository.findByTeamId(team.id);
    if (!summary) {
      summary = {
        teamId: team.id,
        totalPenaltyPoints: 0,
        totalViolations: 0,
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        prolongedHiddenCount: 0
      };
    }

    let incidentNumber;
    if (violationType === 'TAB_SWITCH' || violationType === 'PROLONGED_PAGE_HIDDEN') {
      incidentNumber = summary.tabSwitchCount + 1;
    } else {
      incidentNumber = summary.fullscreenExitCount + 1;
    }

    const incidentKey = `inc_${team.id}_p${player.playerNumber}_${violationType}_#${incidentNumber}`;

    // Anti-cheat events do NOT reduce game score directly in standard config
    const penaltyPoints = 0;
    await scoringService.recordAntiCheatPenalty(team.id, player.id, violationType, penaltyPoints, incidentKey);

    const sanitizedMetadata = metadata ? String(metadata).substring(0, 255) : null;

    const auditRecord = await antiCheatEventRepository.recordEvent({
      teamId: team.id,
      playerId: player.id,
      eventId: event.id,
      violationType,
      detectedAt,
      durationMs: durationMs || 0,
      penaltyPoints,
      incidentKey,
      metadata: sanitizedMetadata
    });

    summary.totalPenaltyPoints = 0;
    summary.totalViolations = (summary.totalViolations || 0) + 1;
    summary.lastViolationAt = detectedAt;

    if (violationType === 'TAB_SWITCH') {
      summary.tabSwitchCount = (summary.tabSwitchCount || 0) + 1;
    } else if (violationType === 'FULLSCREEN_EXIT') {
      summary.fullscreenExitCount = (summary.fullscreenExitCount || 0) + 1;
    } else if (violationType === 'PROLONGED_PAGE_HIDDEN') {
      summary.prolongedHiddenCount = (summary.prolongedHiddenCount || 0) + 1;
    }

    await teamAntiCheatSummaryRepository.upsert(summary);

    // Audit trail log
    await auditService.logEvent(
      'ANTI_CHEAT_VIOLATION',
      event,
      team,
      player,
      JSON.stringify({ violationType, totalViolations: summary.totalViolations }),
      'ANTI_CHEAT'
    );

    const violationLabel = this._formatViolationLabel(violationType);
    const alertMsg = `ANTI-CHEAT ALERT: ${violationLabel} DETECTED (Player ${player.playerNumber}). Incident logged.`;

    // Realtime WebSockets:
    webSocketPublisher.notifyTeamAntiCheatAlert(
      team.id,
      team.teamCode,
      player.playerNumber,
      violationType,
      0,
      0,
      alertMsg
    );

    webSocketPublisher.notifyAdminAntiCheatEvent(
      team.id,
      team.teamCode,
      player.id,
      player.playerNumber,
      player.displayName,
      violationType,
      0,
      0,
      summary.totalViolations,
      alertMsg
    );

    // Recalculate ranks
    leaderboardService.recalculateAndBroadcastRanks(event.id);

    return {
      accepted: true,
      deduplicated: false,
      incidentId: auditRecord.id,
      violationType,
      penaltyPoints: 0,
      teamTotalPenalties: 0,
      message: alertMsg
    };
  }

  _formatViolationLabel(type) {
    switch (type) {
      case 'TAB_SWITCH':
        return 'TAB SWITCH';
      case 'FULLSCREEN_EXIT':
        return 'FULLSCREEN EXIT';
      case 'PROLONGED_PAGE_HIDDEN':
        return 'PROLONGED INACTIVITY';
      default:
        return type;
    }
  }

  async getTeamSummary(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    const summary = await teamAntiCheatSummaryRepository.findByTeamId(teamId);

    return {
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      totalPenaltyPoints: summary ? summary.totalPenaltyPoints : 0,
      totalViolations: summary ? summary.totalViolations : 0,
      tabSwitchCount: summary ? summary.tabSwitchCount : 0,
      fullscreenExitCount: summary ? summary.fullscreenExitCount : 0,
      prolongedHiddenCount: summary ? summary.prolongedHiddenCount : 0,
      lastViolationAt: summary ? summary.lastViolationAt : null
    };
  }

  async getEventSummaries(eventId) {
    const teams = await teamRepository.findByEventId(eventId);
    if (!teams || teams.length === 0) return [];

    const summaries = await teamAntiCheatSummaryRepository.findByEventId(eventId);
    const summaryMap = new Map();
    for (const s of summaries) {
      summaryMap.set(s.teamId, s);
    }

    const dtos = [];
    for (const team of teams) {
      const s = summaryMap.get(team.id);
      dtos.push({
        teamId: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        totalPenaltyPoints: s ? s.totalPenaltyPoints : 0,
        totalViolations: s ? s.totalViolations : 0,
        tabSwitchCount: s ? s.tabSwitchCount : 0,
        fullscreenExitCount: s ? s.fullscreenExitCount : 0,
        prolongedHiddenCount: s ? s.prolongedHiddenCount : 0,
        lastViolationAt: s ? s.lastViolationAt : null
      });
    }

    dtos.sort((a, b) => b.totalPenaltyPoints - a.totalPenaltyPoints);
    return dtos;
  }

  async getEventViolations(eventId) {
    return await antiCheatEventRepository.findByEventId(eventId);
  }

  async getTeamViolations(teamId) {
    return await antiCheatEventRepository.findByTeamId(teamId);
  }

  resetDeduplicationCache() {
    this.playerHiddenStartTime.clear();
    this.recentViolationCache.clear();
  }
}

module.exports = new AntiCheatService();
