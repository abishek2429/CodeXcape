-- V11__create_game_events.sql
-- Create game_events audit table

CREATE TABLE game_events (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details_json TEXT,
    source VARCHAR(50) DEFAULT 'SYSTEM'
);

CREATE INDEX idx_game_events_team_id ON game_events(team_id);
CREATE INDEX idx_game_events_timestamp ON game_events(timestamp);
CREATE INDEX idx_game_events_type ON game_events(event_type);
