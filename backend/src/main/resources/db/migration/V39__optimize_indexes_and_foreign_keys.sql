-- Migration V39: Add composite indexes for high-frequency queries and foreign keys

-- 1. Fast session lookup for authentication filter & teammate telemetry
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_status ON game_sessions(player_id, status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_team_status ON game_sessions(team_id, status);

-- 2. Fast answer attempts lookup and duplicate submission checks
CREATE INDEX IF NOT EXISTS idx_answer_attempts_lookup ON answer_attempts(team_id, player_id, level_id, question_id);
CREATE INDEX IF NOT EXISTS idx_answer_attempts_team_level ON answer_attempts(team_id, level_id);

-- 3. Team level progress and team state indexing for leaderboard & dashboard
CREATE INDEX IF NOT EXISTS idx_team_level_progress_team_status ON team_level_progress(team_id, level_status);
CREATE INDEX IF NOT EXISTS idx_teams_event_state ON teams(event_id, game_state);

-- 4. Fast question retrieval by level, stage, and player number
CREATE INDEX IF NOT EXISTS idx_questions_lookup ON questions(level_id, stage_number, player_number, is_active);

-- 5. Game events indexing for audit queries
CREATE INDEX IF NOT EXISTS idx_game_events_team_time ON game_events(team_id, timestamp);
