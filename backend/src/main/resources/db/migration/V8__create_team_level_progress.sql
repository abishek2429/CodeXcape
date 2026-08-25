-- V8__create_team_level_progress.sql
-- Create team_level_progress table

CREATE TABLE team_level_progress (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    level_id BIGINT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    player1_completed BOOLEAN NOT NULL DEFAULT FALSE,
    player2_completed BOOLEAN NOT NULL DEFAULT FALSE,
    level_status VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_team_level_progress UNIQUE (team_id, level_id)
);

CREATE INDEX idx_team_level_progress_team_id ON team_level_progress(team_id);
CREATE INDEX idx_team_level_progress_level_id ON team_level_progress(level_id);
