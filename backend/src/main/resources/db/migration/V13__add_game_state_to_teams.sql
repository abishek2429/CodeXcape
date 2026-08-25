-- V13__add_game_state_to_teams.sql
-- Add game_state column to teams table for server-authoritative state tracking

ALTER TABLE teams ADD COLUMN game_state VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED';

CREATE INDEX idx_teams_game_state ON teams(game_state);
