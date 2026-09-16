const db = require('../config/db');

const OFFICIAL_TEAMS = [
  'TEAM-ALPHA',
  'TEAM-BETA',
  'TEAM-2NDPLACE',
  'TEAM-BDUCODERS',
  'TEAM-CTRL+ESC',
  'TEAM-CYBERTRONS',
  'TEAM-DOJISDOMAIN',
  'TEAM-DUOSEEKERS',
  'TEAM-GAC_WARRIORS',
  'TEAM-GAMMA',
  'TEAM-INEVITABLE',
  'TEAM-JAMALIANS',
  'TEAM-LAZYCODERS',
  'TEAM-NINETEEN',
  'TEAM-POWERHITTERS',
  'TEAM-PHOENIX',
  'TEAM-REZERO',
  'TEAM-UNKNOWN',
  'TEAM-CHAIFLOW',
  'TEAM-VARISHU'
];

async function configureTeams() {
  console.log('====================================================');
  console.log('CONFIGURING OFFICIAL CODEXCAPE TEAMS & PURGING UNWANTED CREDENTIALS');
  console.log('====================================================\n');

  // 1. Get primary event
  const eventRes = await db.query('SELECT id, name, status FROM events ORDER BY id LIMIT 1');
  if (eventRes.rows.length === 0) {
    throw new Error('No official event found in events table.');
  }
  const eventId = eventRes.rows[0].id;
  console.log(`Primary event: ID ${eventId} ("${eventRes.rows[0].name}")`);

  // Ensure event is READY
  await db.query(`UPDATE events SET status = 'READY', updated_at = NOW() WHERE id = $1`, [eventId]);
  console.log(`  ✓ Event status verified as READY\n`);

  // 2. Terminate all active sessions
  await db.query(`
    UPDATE game_sessions
    SET status = 'TERMINATED', is_connected = FALSE, disconnected_at = NOW()
    WHERE status = 'ACTIVE' OR is_connected = TRUE
  `);

  // 3. Delete all progression/session data for unwanted teams
  const teamCodePlaceholders = OFFICIAL_TEAMS.map((_, i) => `$${i + 1}`).join(', ');

  const purgeTables = [
    'answer_attempts',
    'discovery_submissions',
    'team_stage_progress',
    'team_level_progress',
    'team_riddle_progress',
    'team_story_progress',
    'hint_usage',
    'anti_cheat_events',
    'team_anti_cheat_summary',
    'score_events',
    'game_events',
    'game_sessions'
  ];

  // Purge progression tables for ALL teams to guarantee 100% fresh start
  for (const table of purgeTables) {
    try {
      await db.query(`DELETE FROM ${table}`);
      console.log(`  ✓ Cleaned ${table}`);
    } catch (e) {
      console.warn(`    Notice on ${table}: ${e.message}`);
    }
  }

  // Delete players of non-official teams
  await db.query(
    `DELETE FROM players WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN (${teamCodePlaceholders}))`,
    OFFICIAL_TEAMS
  );
  console.log(`  ✓ Purged players of unauthorized teams`);

  // Delete non-official teams
  const delTeamsRes = await db.query(
    `DELETE FROM teams WHERE team_code NOT IN (${teamCodePlaceholders})`,
    OFFICIAL_TEAMS
  );
  console.log(`  ✓ Purged unauthorized teams (deleted: ${delTeamsRes.rowCount})`);

  // 4. Deduplicate any duplicate records among official teams
  await db.query(`
    DELETE FROM players WHERE team_id IN (
      SELECT id FROM teams t1
      WHERE EXISTS (
        SELECT 1 FROM teams t2
        WHERE t1.team_code = t2.team_code AND t1.id > t2.id
      )
    )
  `);

  await db.query(`
    DELETE FROM teams t1
    WHERE EXISTS (
      SELECT 1 FROM teams t2
      WHERE t1.team_code = t2.team_code AND t1.id > t2.id
    )
  `);
  console.log(`  ✓ Deduplicated official team records`);

  // 5. Ensure all 20 official teams exist and are fresh
  console.log(`\n--- INSERTING / UPDATING THE 20 OFFICIAL TEAMS ---`);
  for (const code of OFFICIAL_TEAMS) {
    // Insert if not exists
    const existing = await db.query(`SELECT id FROM teams WHERE team_code = $1`, [code]);
    let teamId;
    if (existing.rows.length === 0) {
      const ins = await db.query(
        `INSERT INTO teams (
          event_id, team_code, team_name, status, game_state,
          base_score, wrong_attempt_penalty, hint_penalty, anti_cheat_penalty, final_score,
          completed_mini_games, completed_levels, is_flagged_for_review, security_incident_count,
          current_story_key, story_paused_at, total_story_pause_seconds, state_version,
          started_at, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'REGISTERED', 'NOT_STARTED',
          0, 0, 0, 0, 0,
          0, 0, false, 0,
          NULL, NULL, 0, 1,
          NULL, NULL, NOW(), NOW()
        ) RETURNING id`,
        [eventId, code, code]
      );
      teamId = ins.rows[0].id;
      console.log(`  [NEW] Created team: ${code} (ID: ${teamId})`);
    } else {
      teamId = existing.rows[0].id;
      await db.query(
        `UPDATE teams
         SET event_id = $1,
             team_name = $2,
             status = 'REGISTERED',
             game_state = 'NOT_STARTED',
             base_score = 0,
             wrong_attempt_penalty = 0,
             hint_penalty = 0,
             anti_cheat_penalty = 0,
             final_score = 0,
             completed_mini_games = 0,
             completed_levels = 0,
             is_flagged_for_review = false,
             security_incident_count = 0,
             current_story_key = NULL,
             story_paused_at = NULL,
             total_story_pause_seconds = 0,
             state_version = 1,
             started_at = NULL,
             completed_at = NULL,
             updated_at = NOW()
         WHERE id = $3`,
        [eventId, code, teamId]
      );
      console.log(`  [SYNC] Reset team: ${code} (ID: ${teamId})`);
    }

    // Ensure Player 1
    const p1 = await db.query(`SELECT id FROM players WHERE team_id = $1 AND player_number = 1`, [teamId]);
    if (p1.rows.length === 0) {
      await db.query(
        `INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
         VALUES ($1, 1, $2, 'INACTIVE', false, true, NOW(), NOW())`,
        [teamId, `${code} Player 1`]
      );
    } else {
      await db.query(
        `UPDATE players
         SET display_name = $1, status = 'INACTIVE', is_ready = false, is_active = true, updated_at = NOW()
         WHERE id = $2`,
        [`${code} Player 1`, p1.rows[0].id]
      );
    }

    // Ensure Player 2
    const p2 = await db.query(`SELECT id FROM players WHERE team_id = $1 AND player_number = 2`, [teamId]);
    if (p2.rows.length === 0) {
      await db.query(
        `INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
         VALUES ($1, 2, $2, 'INACTIVE', false, true, NOW(), NOW())`,
        [teamId, `${code} Player 2`]
      );
    } else {
      await db.query(
        `UPDATE players
         SET display_name = $1, status = 'INACTIVE', is_ready = false, is_active = true, updated_at = NOW()
         WHERE id = $2`,
        [`${code} Player 2`, p2.rows[0].id]
      );
    }

    // Delete any erroneous player records with player_number > 2
    await db.query(`DELETE FROM players WHERE team_id = $1 AND player_number NOT IN (1, 2)`, [teamId]);
  }

  // 6. Verify final database state
  console.log(`\n--- VERIFICATION OF DATABASE STATE ---`);
  const finalTeams = await db.query(`SELECT id, team_code, team_name, status, game_state FROM teams ORDER BY team_code`);
  const finalPlayers = await db.query(`SELECT COUNT(*) as total_players FROM players`);

  console.log(`Total teams in database: ${finalTeams.rows.length} (Expected: 20)`);
  console.log(`Total players in database: ${finalPlayers.rows[0].total_players} (Expected: 40)`);

  console.log('\nConfigured Teams List:');
  finalTeams.rows.forEach((t, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}. ${t.team_code.padEnd(20, ' ')} [${t.status} | ${t.game_state}]`);
  });

  if (finalTeams.rows.length !== 20) {
    throw new Error(`Team count mismatch! Found ${finalTeams.rows.length}, expected 20.`);
  }

  if (parseInt(finalPlayers.rows[0].total_players, 10) !== 40) {
    throw new Error(`Player count mismatch! Found ${finalPlayers.rows[0].total_players}, expected 40.`);
  }

  console.log('\n====================================================');
  console.log('SUCCESS: EXACTLY 20 OFFICIAL TEAMS CONFIGURED!');
  console.log('====================================================\n');
  process.exit(0);
}

configureTeams().catch(err => {
  console.error('Configuration failed:', err);
  process.exit(1);
});
