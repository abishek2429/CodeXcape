-- V4__create_players.sql
-- Create players table

CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_number INT NOT NULL CHECK (player_number IN (1, 2)),
    display_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_players_team_number UNIQUE (team_id, player_number)
);

CREATE INDEX idx_players_team_id ON players(team_id);
