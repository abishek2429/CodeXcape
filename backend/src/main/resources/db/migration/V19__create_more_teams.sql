-- Insert Team Alpha
INSERT INTO teams (id, event_id, team_code, team_name, status, game_state, created_at, updated_at)
VALUES (1000, 999, 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10001, 1000, 1, 'Alpha Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10002, 1000, 2, 'Alpha Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert Team Bravo
INSERT INTO teams (id, event_id, team_code, team_name, status, game_state, created_at, updated_at)
VALUES (1001, 999, 'TEAM-BRAVO', 'Bravo Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10011, 1001, 1, 'Bravo Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10012, 1001, 2, 'Bravo Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert Team Charlie
INSERT INTO teams (id, event_id, team_code, team_name, status, game_state, created_at, updated_at)
VALUES (1002, 999, 'TEAM-CHARL', 'Charlie Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10021, 1002, 1, 'Charlie Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, team_id, player_number, display_name, status, created_at, updated_at)
VALUES (10022, 1002, 2, 'Charlie Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
