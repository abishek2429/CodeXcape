const db = require('../config/db');

class PlayerRepository {
  async findById(id) {
    const res = await db.query(`SELECT * FROM players WHERE id = $1`, [id]);
    return this._mapRow(res.rows[0]);
  }

  async findByTeamIdAndPlayerNumber(teamId, playerNumber) {
    const res = await db.query(
      `SELECT * FROM players WHERE team_id = $1 AND player_number = $2`,
      [teamId, playerNumber]
    );
    return this._mapRow(res.rows[0]);
  }

  async findByTeamId(teamId) {
    const res = await db.query(
      `SELECT * FROM players WHERE team_id = $1 ORDER BY player_number ASC`,
      [teamId]
    );
    return res.rows.map(r => this._mapRow(r));
  }

  async create(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [
        data.teamId || data.team_id,
        data.playerNumber || data.player_number,
        data.displayName || data.display_name,
        data.status || 'INACTIVE'
      ]
    );
    return this._mapRow(res.rows[0]);
  }

  async save(player, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE players
       SET display_name = $2,
           status = $3,
           is_ready = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [player.id, player.displayName || player.display_name, player.status, Boolean(player.isReady ?? player.is_ready)]
    );
    return this._mapRow(res.rows[0]);
  }

  async updateStatus(id, status, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE players SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return this._mapRow(res.rows[0]);
  }

  async updateReady(id, isReady, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE players SET is_ready = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, Boolean(isReady)]
    );
    return this._mapRow(res.rows[0]);
  }

  async deleteByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(`DELETE FROM players WHERE team_id = $1`, [teamId]);
  }

  async resetStatusByTeamId(teamId, client = null) {
    const executor = client || db;
    await executor.query(
      `UPDATE players SET status = 'INACTIVE', is_ready = false, updated_at = NOW() WHERE team_id = $1`,
      [teamId]
    );
  }

  async resetAllStatuses(client = null) {
    const executor = client || db;
    await executor.query(
      `UPDATE players SET status = 'INACTIVE', is_ready = false, updated_at = NOW()`
    );
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: parseInt(r.id, 10),
      teamId: parseInt(r.team_id, 10),
      team_id: parseInt(r.team_id, 10),
      playerNumber: parseInt(r.player_number, 10),
      player_number: parseInt(r.player_number, 10),
      displayName: r.display_name,
      display_name: r.display_name,
      status: r.status,
      isReady: Boolean(r.is_ready),
      is_ready: Boolean(r.is_ready),
      isActive: r.is_active !== false,
      is_active: r.is_active !== false,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}

module.exports = new PlayerRepository();
