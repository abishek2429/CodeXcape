-- Migration V39: Add performance indexes for high-frequency gameplay queries

-- Index for session lookup by player_id and status (checked on every login, lobby, and telemetry call)
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_status ON game_sessions (player_id, status);

-- Composite index for answer attempt checks (checked on every question view and answer submit)
CREATE INDEX IF NOT EXISTS idx_answer_attempts_lookup ON answer_attempts (team_id, player_id, level_id, question_id);

-- Index for game events by team_id and timestamp
CREATE INDEX IF NOT EXISTS idx_game_events_team_time ON game_events (team_id, timestamp);

-- Index for teams by event_id and game_state (for dashboard statistics and team filters)
CREATE INDEX IF NOT EXISTS idx_teams_event_state ON teams (event_id, game_state);

-- Index for question retrieval by level, stage, player role and active status
CREATE INDEX IF NOT EXISTS idx_questions_lookup ON questions (level_id, stage_number, player_number, is_active);

-- Index for hints retrieval by level, stage, active status and display order
CREATE INDEX IF NOT EXISTS idx_hints_lookup ON hints (level_id, stage_number, is_active, display_order);

-- Index for team level progress by team and level status
CREATE INDEX IF NOT EXISTS idx_team_level_progress_team_status ON team_level_progress (team_id, level_status);
