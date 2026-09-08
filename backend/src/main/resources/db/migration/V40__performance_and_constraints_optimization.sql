-- Migration V40: Performance optimizations and composite indexes

-- 1. High-speed index on answer attempts for correct answer lookups
CREATE INDEX IF NOT EXISTS idx_answer_attempts_player_question_correct
ON answer_attempts(player_id, question_id, is_correct);

-- 2. Fast stage progress lookup for QuestionAnswerService
CREATE INDEX IF NOT EXISTS idx_team_stage_progress_lookup
ON team_stage_progress(team_id, level_id, stage_number, completed_at);
