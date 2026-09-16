-- Restore the local demo login after test data reused the legacy fixed team IDs.
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT 999, 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-ALPHA');

UPDATE players
SET team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1),
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (10001, 10002)
   OR display_name IN ('Alpha Player 1', 'Alpha Player 2');
