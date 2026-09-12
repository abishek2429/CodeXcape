-- V41: Reset credentials, clean sessions, and seed 10+ competition and test teams

-- 1. Ensure required columns exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Advance sequence past hardcoded legacy IDs (1000, 10001, 10002)
ALTER TABLE teams ALTER COLUMN id RESTART WITH 10000;
ALTER TABLE players ALTER COLUMN id RESTART WITH 20000;

-- 2. Terminate and clean all existing active/stale game sessions
UPDATE game_sessions
SET status = 'TERMINATED',
    is_connected = FALSE,
    disconnected_at = CURRENT_TIMESTAMP
WHERE status = 'ACTIVE' OR is_connected = TRUE;

-- 3. Reset all existing players to INACTIVE, not ready, and eligible
UPDATE players
SET status = 'INACTIVE',
    is_ready = FALSE,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Reset all existing teams to REGISTERED and NOT_STARTED, clearing runtime timestamps
UPDATE teams
SET status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    started_at = NULL,
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

-- 5. Purge past test attempts and progression artifacts so all teams start completely fresh
DELETE FROM answer_attempts;
DELETE FROM discovery_submissions;
DELETE FROM team_stage_progress;
DELETE FROM team_level_progress;
DELETE FROM hint_usage;

-- 6. Ensure active event is in READY status
UPDATE events
SET status = 'READY',
    updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM events ORDER BY id LIMIT 1);

-- 7. Macro to seed teams using pure ANSI SQL (compatible with both H2 and PostgreSQL)

-- CODEXCAPE-TEST
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'CODEXCAPE-TEST', 'CodeXcape Test Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'CODEXCAPE-TEST');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'CODEXCAPE-TEST';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 1, 'Test Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 2, 'Test Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-ALPHA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-ALPHA');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-ALPHA';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 1, 'Alpha Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 2, 'Alpha Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-BETA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-BETA', 'Beta Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-BETA');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-BETA';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BETA' ORDER BY id LIMIT 1), 1, 'Beta Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BETA' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BETA' ORDER BY id LIMIT 1), 2, 'Beta Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BETA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-BRAVO
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-BRAVO', 'Bravo Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-BRAVO');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-BRAVO';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1), 1, 'Bravo Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1), 2, 'Bravo Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-CHARLIE
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-CHARLIE', 'Charlie Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-CHARLIE');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-CHARLIE';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARLIE' ORDER BY id LIMIT 1), 1, 'Charlie Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARLIE' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARLIE' ORDER BY id LIMIT 1), 2, 'Charlie Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARLIE' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-CHARL (Legacy)
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-CHARL', 'Charlie Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-CHARL');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-CHARL';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1), 1, 'Charlie Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1), 2, 'Charlie Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-DELTA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-DELTA', 'Delta Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-DELTA');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-DELTA';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-DELTA' ORDER BY id LIMIT 1), 1, 'Delta Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-DELTA' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-DELTA' ORDER BY id LIMIT 1), 2, 'Delta Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-DELTA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-ECHO
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-ECHO', 'Echo Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-ECHO');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-ECHO';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ECHO' ORDER BY id LIMIT 1), 1, 'Echo Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ECHO' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ECHO' ORDER BY id LIMIT 1), 2, 'Echo Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ECHO' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-FOXTROT
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-FOXTROT', 'Foxtrot Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-FOXTROT');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-FOXTROT';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-FOXTROT' ORDER BY id LIMIT 1), 1, 'Foxtrot Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-FOXTROT' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-FOXTROT' ORDER BY id LIMIT 1), 2, 'Foxtrot Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-FOXTROT' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-GOLF
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-GOLF', 'Golf Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-GOLF');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-GOLF';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-GOLF' ORDER BY id LIMIT 1), 1, 'Golf Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-GOLF' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-GOLF' ORDER BY id LIMIT 1), 2, 'Golf Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-GOLF' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-HOTEL
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-HOTEL', 'Hotel Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-HOTEL');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-HOTEL';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-HOTEL' ORDER BY id LIMIT 1), 1, 'Hotel Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-HOTEL' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-HOTEL' ORDER BY id LIMIT 1), 2, 'Hotel Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-HOTEL' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-INDIA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-INDIA', 'India Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-INDIA');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-INDIA';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-INDIA' ORDER BY id LIMIT 1), 1, 'India Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-INDIA' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-INDIA' ORDER BY id LIMIT 1), 2, 'India Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-INDIA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-JULIET
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-JULIET', 'Juliet Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-JULIET');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-JULIET';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-JULIET' ORDER BY id LIMIT 1), 1, 'Juliet Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-JULIET' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-JULIET' ORDER BY id LIMIT 1), 2, 'Juliet Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-JULIET' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-KILO
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-KILO', 'Kilo Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-KILO');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-KILO';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-KILO' ORDER BY id LIMIT 1), 1, 'Kilo Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-KILO' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-KILO' ORDER BY id LIMIT 1), 2, 'Kilo Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-KILO' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-LIMA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-LIMA', 'Lima Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-LIMA');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-LIMA';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-LIMA' ORDER BY id LIMIT 1), 1, 'Lima Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-LIMA' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-LIMA' ORDER BY id LIMIT 1), 2, 'Lima Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-LIMA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-MIKE
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-MIKE', 'Mike Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-MIKE');
UPDATE teams SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1), status = 'REGISTERED', game_state = 'NOT_STARTED', started_at = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE team_code = 'TEAM-MIKE';
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-MIKE' ORDER BY id LIMIT 1), 1, 'Mike Player 1', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-MIKE' ORDER BY id LIMIT 1) AND player_number = 1);
INSERT INTO players (team_id, player_number, display_name, status, is_ready, is_active, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-MIKE' ORDER BY id LIMIT 1), 2, 'Mike Player 2', 'INACTIVE', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-MIKE' ORDER BY id LIMIT 1) AND player_number = 2);
