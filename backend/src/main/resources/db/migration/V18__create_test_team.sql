-- Insert a test event
INSERT INTO events (id, name, description, status, passkey_hash, created_at, updated_at)
VALUES (999, 'Test Event', 'Development Test Event', 'ACTIVE', '$2a$10$wE/.76o.xO4d3V1Fq5Q1nO.1nFk1v5q2e4R/2hW2/8kU1G2A0B7mK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert a test team
INSERT INTO teams (id, event_id, team_code, team_name, status, game_state, created_at, updated_at)
VALUES (999, 999, 'TEST-1234', 'The Test Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert Player 1
INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (9991, 999, 1, 'Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert Player 2
INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (9992, 999, 2, 'Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
