-- V52: Create persistent team riddle progress table for CodeXcape 6-riddle system

CREATE TABLE IF NOT EXISTS team_riddle_progress (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    riddle_index INT NOT NULL CHECK (riddle_index >= 1 AND riddle_index <= 6),
    is_solved BOOLEAN NOT NULL DEFAULT FALSE,
    solved_digit VARCHAR(10) NULL,
    solved_at TIMESTAMP WITH TIME ZONE NULL,
    solved_by_player_id BIGINT NULL REFERENCES players(id) ON DELETE SET NULL,
    wrong_attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_riddle UNIQUE (team_id, riddle_index)
);

CREATE INDEX IF NOT EXISTS idx_team_riddle_team ON team_riddle_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_team_riddle_team_idx ON team_riddle_progress(team_id, riddle_index);
