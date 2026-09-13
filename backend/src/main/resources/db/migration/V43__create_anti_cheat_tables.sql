-- V43: Create Anti-Cheat Events and Team Penalty Summary Tables

CREATE TABLE IF NOT EXISTS anti_cheat_events (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms BIGINT,
    penalty_points INT NOT NULL,
    incident_key VARCHAR(100),
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anti_cheat_team ON anti_cheat_events(team_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_player ON anti_cheat_events(player_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_event ON anti_cheat_events(event_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_team_detected ON anti_cheat_events(team_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_incident_key ON anti_cheat_events(incident_key);

CREATE TABLE IF NOT EXISTS team_anti_cheat_summary (
    team_id BIGINT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    total_penalty_points INT NOT NULL DEFAULT 0,
    total_violations INT NOT NULL DEFAULT 0,
    tab_switch_count INT NOT NULL DEFAULT 0,
    fullscreen_exit_count INT NOT NULL DEFAULT 0,
    prolonged_hidden_count INT NOT NULL DEFAULT 0,
    last_violation_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_anti_cheat_summary_penalties ON team_anti_cheat_summary(total_penalty_points DESC);
