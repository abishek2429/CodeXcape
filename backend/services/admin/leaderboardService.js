const eventRepository = require('../../repositories/eventRepository');
const teamRepository = require('../../repositories/teamRepository');
const playerRepository = require('../../repositories/playerRepository');
const teamLevelProgressRepository = require('../../repositories/teamLevelProgressRepository');
const teamAntiCheatSummaryRepository = require('../../repositories/teamAntiCheatSummaryRepository');
const webSocketPublisher = require('../webSocketService');
const scoringConfig = require('../../config/scoringConfig');

class LeaderboardService {
  constructor() {
    this.lastBroadcastRanks = new Map();
  }

  async getLeaderboard(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      const err = new Error(`Event not found for ID ${eventId}`);
      err.status = 404;
      throw err;
    }

    const teams = await teamRepository.findByEventId(eventId);
    if (!teams || teams.length === 0) {
      return [];
    }

    const summaries = await teamAntiCheatSummaryRepository.findByEventId(eventId);
    const summaryMap = new Map();
    for (const s of summaries) {
      summaryMap.set(s.teamId, s);
    }

    // Sort teams using exact Java comparator logic
    teams.sort(this._getFastTeamComparator(event, summaryMap));

    const result = [];
    let rank = 1;

    for (const team of teams) {
      const progressList = await teamLevelProgressRepository.findByTeamId(team.id);
      const players = await playerRepository.findByTeamId(team.id);
      const summary = summaryMap.get(team.id);

      result.push(this._buildLeaderboardEntry(event, team, rank++, progressList, players, summary));
    }

    return result;
  }

  async getTeamCurrentRank(teamId) {
    if (this.lastBroadcastRanks.has(teamId)) {
      return this.lastBroadcastRanks.get(teamId);
    }

    const team = await teamRepository.findById(teamId);
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    const allTeams = await teamRepository.findByEventId(team.eventId);
    if (!allTeams || allTeams.length === 0) {
      return null;
    }

    const summaries = await teamAntiCheatSummaryRepository.findByEventId(team.eventId);
    const summaryMap = new Map();
    for (const s of summaries) {
      summaryMap.set(s.teamId, s);
    }

    allTeams.sort(this._getFastTeamComparator(null, summaryMap));

    for (let i = 0; i < allTeams.length; i++) {
      this.lastBroadcastRanks.set(allTeams[i].id, i + 1);
    }

    return this.lastBroadcastRanks.get(teamId) || null;
  }

  async recalculateAndBroadcastRanks(eventId) {
    const allTeams = await teamRepository.findByEventId(eventId);
    if (!allTeams || allTeams.length === 0) return;

    const event = await eventRepository.findById(eventId);
    const summaries = await teamAntiCheatSummaryRepository.findByEventId(eventId);
    const summaryMap = new Map();
    for (const s of summaries) {
      summaryMap.set(s.teamId, s);
    }

    allTeams.sort(this._getFastTeamComparator(event, summaryMap));

    for (let i = 0; i < allTeams.length; i++) {
      const team = allTeams[i];
      const newRank = i + 1;
      const prevRank = this.lastBroadcastRanks.get(team.id);
      if (prevRank !== newRank) {
        this.lastBroadcastRanks.set(team.id, newRank);
        webSocketPublisher.notifyRankChanged(team.id, newRank);
      }
    }
  }

  async getEventStatistics(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      const err = new Error(`Event not found for ID ${eventId}`);
      err.status = 404;
      throw err;
    }

    const teams = await teamRepository.findByEventId(eventId);
    const totalRegistered = teams.length;
    const completedCount = teams.filter(t => t.gameState === 'COMPLETED').length;
    const notStartedCount = teams.filter(t => t.gameState === 'NOT_STARTED').length;
    const startedCount = totalRegistered - notStartedCount;
    const activeCount = teams.filter(t => t.gameState === 'IN_PROGRESS' || t.gameState === 'FINAL_PASSKEY').length;

    const durations = [];
    let latestCompletion = null;

    for (const team of teams) {
      if (team.gameState === 'COMPLETED' && team.completedAt) {
        const d = this._calculateDurationSeconds(event, team);
        durations.push(d);

        const compDate = new Date(team.completedAt);
        if (!latestCompletion || compDate > new Date(latestCompletion)) {
          latestCompletion = team.completedAt;
        }
      }
    }

    const fastestSeconds = durations.length > 0 ? Math.min(...durations) : null;
    const averageSeconds = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : null;

    // Level breakdown
    const levelBreakdown = [];
    for (let lvl = 1; lvl <= 6; lvl++) {
      let reached = 0;
      let completed = 0;
      let currentlyHere = 0;

      for (const team of teams) {
        const progressList = await teamLevelProgressRepository.findByTeamId(team.id);
        const lvlProgress = progressList.find(p => p.levelNumber === lvl);

        if (lvlProgress) {
          if (lvlProgress.levelStatus !== 'LOCKED') reached++;
          if (lvlProgress.levelStatus === 'COMPLETED') completed++;
          if (lvlProgress.levelStatus === 'AVAILABLE' || lvlProgress.levelStatus === 'IN_PROGRESS') {
            currentlyHere++;
          }
        } else if (team.gameState === 'FINAL_PASSKEY' && lvl === 6) {
          currentlyHere++;
        } else if (team.gameState === 'COMPLETED') {
          reached++;
          completed++;
        }
      }

      levelBreakdown.push({
        levelNumber: lvl,
        levelName: `Level ${lvl}`,
        teamsReached: reached,
        teamsCompleted: completed,
        currentlyHere
      });
    }

    return {
      eventId: event.id,
      eventName: event.name,
      eventStatus: event.status,
      totalRegisteredTeams: totalRegistered,
      startedTeams: startedCount,
      activeTeams: activeCount,
      completedTeams: completedCount,
      notStartedTeams: notStartedCount,
      disconnectedTeams: 0,
      fastestCompletionSeconds: fastestSeconds,
      formattedFastestCompletion: this._formatDuration(fastestSeconds),
      averageCompletionSeconds: averageSeconds,
      formattedAverageCompletion: this._formatDuration(averageSeconds),
      latestCompletionTime: latestCompletion,
      levelBreakdown
    };
  }

  async getPublicLeaderboard(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      const err = new Error(`Event not found for ID ${eventId}`);
      err.status = 404;
      throw err;
    }

    const fullLeaderboard = await this.getLeaderboard(eventId);

    const completedEntries = fullLeaderboard
      .filter(e => e.gameState === 'COMPLETED')
      .map(e => ({
        rank: e.rank,
        teamName: e.teamName,
        status: 'COMPLETED',
        currentLevel: 6,
        formattedDuration: e.formattedDuration,
        antiCheatPenalties: e.antiCheatPenalties,
        competitiveScore: e.competitiveScore
      }));

    const activeEntries = fullLeaderboard
      .filter(e => e.gameState !== 'COMPLETED')
      .map(e => ({
        rank: null,
        teamName: e.teamName,
        status: e.gameState,
        currentLevel: e.currentLevel,
        formattedDuration: '-',
        antiCheatPenalties: e.antiCheatPenalties,
        competitiveScore: e.competitiveScore
      }));

    return {
      eventId: event.id,
      eventName: event.name,
      eventStatus: event.status,
      completedEntries,
      activeEntries
    };
  }

  _buildLeaderboardEntry(event, team, rank, progressList, players, summary) {
    const activeProgress = (progressList || []).find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );
    const currentLevel = activeProgress ? activeProgress.levelNumber : (team.gameState === 'COMPLETED' ? 6 : 1);

    const p1 = (players || []).find(p => p.playerNumber === 1);
    const p2 = (players || []).find(p => p.playerNumber === 2);

    let durationSeconds = null;
    let formattedDuration = '-';

    if (team.gameState === 'COMPLETED' && team.completedAt) {
      durationSeconds = this._calculateDurationSeconds(event, team);
      formattedDuration = this._formatDuration(durationSeconds);
    }

    const totalViolations = summary ? summary.totalViolations : 0;

    return {
      rank: team.gameState === 'COMPLETED' ? rank : null,
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      status: team.status,
      gameState: team.gameState,
      currentLevel,
      player1Name: p1 ? p1.displayName : 'Player 1',
      player2Name: p2 ? p2.displayName : 'Player 2',
      completedAt: team.completedAt,
      durationSeconds,
      formattedDuration,
      antiCheatPenalties: 0,
      totalViolations,
      competitiveScore: team.finalScore || 0,
      baseScore: team.baseScore || 0,
      wrongAttemptPenalty: team.wrongAttemptPenalty || 0,
      hintPenalty: team.hintPenalty || 0,
      antiCheatPenalty: 0,
      finalScore: team.finalScore || 0,
      completedMiniGames: team.completedMiniGames || 0,
      totalMiniGames: scoringConfig.TOTAL_MINI_GAMES,
      completedLevels: team.completedLevels || 0,
      totalLevels: 6,
      isFlaggedForReview: team.isFlaggedForReview || false,
      securityIncidentCount: team.securityIncidentCount || 0
    };
  }

  _getFastTeamComparator(event, summaryMap) {
    return (t1, t2) => {
      const t1Completed = t1.gameState === 'COMPLETED' && t1.completedAt != null;
      const t2Completed = t2.gameState === 'COMPLETED' && t2.completedAt != null;

      // 1. Completion Status
      if (t1Completed && !t2Completed) return -1;
      if (!t1Completed && t2Completed) return 1;

      // 2. Higher legitimate GAME SCORE
      const s1 = this._getEffectiveScore(t1);
      const s2 = this._getEffectiveScore(t2);
      if (s1 !== s2) {
        return s2 - s1; // Descending
      }

      // 3. Fewer anti-cheat events
      const ac1 = summaryMap && summaryMap.has(t1.id) ? summaryMap.get(t1.id).totalViolations : 0;
      const ac2 = summaryMap && summaryMap.has(t2.id) ? summaryMap.get(t2.id).totalViolations : 0;
      if (ac1 !== ac2) {
        return ac1 - ac2; // Ascending
      }

      // 4. Faster legitimate completion time
      const d1 = this._calculateDurationSeconds(event, t1);
      const d2 = this._calculateDurationSeconds(event, t2);
      if (d1 !== d2) {
        return d1 - d2; // Ascending
      }

      // 5. Earlier completion timestamp
      if (t1.completedAt && t2.completedAt) {
        const timeDiff = new Date(t1.completedAt).getTime() - new Date(t2.completedAt).getTime();
        if (timeDiff !== 0) return timeDiff;
      }

      // 6. Tie-breaker by ID
      return t1.id - t2.id;
    };
  }

  _getEffectiveScore(team) {
    if (team.finalScore != null && team.finalScore > 0) {
      return team.finalScore;
    }
    const base = (team.baseScore != null && team.baseScore > 0) ? team.baseScore : (team.gameState === 'COMPLETED' ? 1000 : 0);
    const wrong = team.wrongAttemptPenalty || 0;
    const hint = team.hintPenalty || 0;
    return Math.max(0, base - wrong - hint);
  }

  _calculateDurationSeconds(event, team) {
    const startTimeStr = team.startedAt || (event && event.startTime) || team.createdAt;
    const startTime = startTimeStr ? new Date(startTimeStr).getTime() : Date.now();
    const endTime = team.completedAt ? new Date(team.completedAt).getTime() : Date.now();

    const diff = Math.max(0, Math.floor((endTime - startTime) / 1000));
    let storyPauseSeconds = team.totalStoryPauseSeconds || 0;
    if (team.isStoryActive && team.storyPausedAt && !team.completedAt) {
      storyPauseSeconds += Math.max(0, Math.floor((Date.now() - new Date(team.storyPausedAt).getTime()) / 1000));
    }
    return Math.max(0, diff - storyPauseSeconds);
  }

  _formatDuration(totalSeconds) {
    if (totalSeconds == null) return '-';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(minutes)}m ${pad(seconds)}s`;
  }
}

module.exports = new LeaderboardService();
