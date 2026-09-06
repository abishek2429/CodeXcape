-- Reusable local test event and team in standard SQL
INSERT INTO events (name, description, status, passkey_hash, created_at, updated_at)
SELECT 'CodeXcape Test Event', 'Reusable local test event', 'READY', '$2a$10$wE/.76o.xO4d3V1Fq5Q1nO.1nFk1v5q2e4R/2hW2/8kU1G2A0B7mK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'CodeXcape Test Event');

UPDATE events
SET status = 'READY',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'CodeXcape Test Event';

INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events WHERE name = 'CodeXcape Test Event' ORDER BY id LIMIT 1), 'CODEXCAPE-TEST', 'CodeXcape Test Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'CODEXCAPE-TEST');

UPDATE teams
SET event_id = (SELECT id FROM events WHERE name = 'CodeXcape Test Event' ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'CODEXCAPE-TEST';

INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 1, 'Test Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 1
);

INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 2, 'Test Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 2
);