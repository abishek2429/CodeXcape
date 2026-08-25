-- V6__create_questions.sql
-- Create questions table

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    level_id BIGINT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    player_number VARCHAR(20) NOT NULL CHECK (player_number IN ('PLAYER_1', 'PLAYER_2')),
    question_content TEXT NOT NULL,
    expected_answer_hash VARCHAR(255) NOT NULL,
    answer_type VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_questions_level_id ON questions(level_id);
CREATE UNIQUE INDEX uq_questions_level_player_active ON questions(level_id, player_number) WHERE is_active = TRUE;
