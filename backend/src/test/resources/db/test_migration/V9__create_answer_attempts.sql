CREATE TABLE answer_attempts (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    level_id BIGINT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_number INT NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_answer_attempts_team_id ON answer_attempts(team_id);
CREATE INDEX idx_answer_attempts_player_id ON answer_attempts(player_id);
CREATE INDEX idx_answer_attempts_level_id ON answer_attempts(level_id);
