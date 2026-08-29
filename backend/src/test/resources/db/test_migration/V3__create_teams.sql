CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_code VARCHAR(50) NOT NULL,
    team_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_teams_event_team_code UNIQUE (event_id, team_code)
);

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_code ON teams(team_code);
