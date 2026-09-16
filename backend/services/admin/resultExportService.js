const leaderboardService = require('./leaderboardService');
const adminAuditService = require('./adminAuditService');

class ResultExportService {
  async generateEventResultsCsv(principal, eventId) {
    const leaderboard = await leaderboardService.getLeaderboard(eventId);

    const rows = [];
    rows.push('Rank,Team Name,Player 1,Player 2,Status,Current Level,Completed At,Duration');

    for (const entry of leaderboard) {
      const rankStr = entry.rank != null ? String(entry.rank) : '-';
      const completedAtStr = entry.completedAt ? new Date(entry.completedAt).toISOString() : '-';

      rows.push([
        this._escapeCsv(rankStr),
        this._escapeCsv(entry.teamName),
        this._escapeCsv(entry.player1Name),
        this._escapeCsv(entry.player2Name),
        this._escapeCsv(entry.gameState),
        entry.currentLevel,
        this._escapeCsv(completedAtStr),
        this._escapeCsv(entry.formattedDuration)
      ].join(','));
    }

    await adminAuditService.logAction(
      principal,
      'EXPORT_RESULTS_CSV',
      `Event #${eventId}`,
      `Exported event completion results CSV (${leaderboard.length} teams)`
    );

    return rows.join('\n') + '\n';
  }

  async generateTeamProgressCsv(principal, eventId) {
    const leaderboard = await leaderboardService.getLeaderboard(eventId);

    const rows = [];
    rows.push('Team Code,Team Name,Player 1,Player 2,Status,Game State,Current Level,Completed At');

    for (const entry of leaderboard) {
      const completedAtStr = entry.completedAt ? new Date(entry.completedAt).toISOString() : '-';

      rows.push([
        this._escapeCsv(entry.teamCode),
        this._escapeCsv(entry.teamName),
        this._escapeCsv(entry.player1Name),
        this._escapeCsv(entry.player2Name),
        this._escapeCsv(entry.status),
        this._escapeCsv(entry.gameState),
        entry.currentLevel,
        this._escapeCsv(completedAtStr)
      ].join(','));
    }

    await adminAuditService.logAction(
      principal,
      'EXPORT_PROGRESS_CSV',
      `Event #${eventId}`,
      `Exported operational team progress CSV (${leaderboard.length} teams)`
    );

    return rows.join('\n') + '\n';
  }

  _escapeCsv(input) {
    if (input == null) return '""';
    const escaped = String(input).replace(/"/g, '""');
    return `"${escaped}"`;
  }
}

module.exports = new ResultExportService();
