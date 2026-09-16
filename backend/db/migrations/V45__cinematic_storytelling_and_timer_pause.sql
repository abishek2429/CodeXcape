-- V45: Cinematic Storytelling, Narrative States, and Authoritative Timer Pause Tracking

ALTER TABLE teams ADD COLUMN IF NOT EXISTS current_story_key VARCHAR(50);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS story_paused_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_story_pause_seconds BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS team_story_progress (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    story_key VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    pause_duration_seconds BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_story_progress UNIQUE (team_id, story_key)
);

CREATE INDEX IF NOT EXISTS idx_team_story_progress_team ON team_story_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_team_story_progress_status ON team_story_progress(team_id, status);
CREATE INDEX IF NOT EXISTS idx_teams_story ON teams(current_story_key);
