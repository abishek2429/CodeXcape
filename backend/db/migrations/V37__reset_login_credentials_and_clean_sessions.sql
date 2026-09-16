-- V37: Reset all login credentials, terminate game sessions, and reset player & team states

-- 1. Ensure required columns exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Terminate and clean all existing active/stale game sessions
UPDATE game_sessions
SET status = 'TERMINATED',
    is_connected = FALSE,
    disconnected_at = CURRENT_TIMESTAMP
WHERE status = 'ACTIVE' OR is_connected = TRUE;

-- 3. Reset all players to INACTIVE and not ready
UPDATE players
SET status = 'INACTIVE',
    is_ready = FALSE,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Reset all teams to REGISTERED and NOT_STARTED, clearing runtime timestamps
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

-- 6. Ensure default verified test and competition teams exist
-- CODEXCAPE-TEST
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'CODEXCAPE-TEST', 'CodeXcape Test Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'CODEXCAPE-TEST');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    started_at = NULL,
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'CODEXCAPE-TEST';

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 1, 'Test Player 1', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 2, 'Test Player 2', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-ALPHA
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-ALPHA');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    started_at = NULL,
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'TEAM-ALPHA';

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 1, 'Alpha Player 1', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 2, 'Alpha Player 2', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-BRAVO
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-BRAVO', 'Bravo Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-BRAVO');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    started_at = NULL,
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'TEAM-BRAVO';

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1), 1, 'Bravo Player 1', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1), 2, 'Bravo Player 2', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-BRAVO' ORDER BY id LIMIT 1) AND player_number = 2);

-- TEAM-CHARL
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-CHARL', 'Charlie Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-CHARL');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    started_at = NULL,
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'TEAM-CHARL';

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1), 1, 'Charlie Player 1', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, is_ready, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1), 2, 'Charlie Player 2', 'INACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-CHARL' ORDER BY id LIMIT 1) AND player_number = 2);

-- 7. Ensure active event is in READY status
UPDATE events
SET status = 'READY',
    updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM events ORDER BY id LIMIT 1);
