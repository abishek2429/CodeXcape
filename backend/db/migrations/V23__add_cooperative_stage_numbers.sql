ALTER TABLE questions ADD COLUMN IF NOT EXISTS stage_number INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_questions_level_stage
    ON questions (level_id, stage_number, player_number);