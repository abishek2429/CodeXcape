CREATE TABLE IF NOT EXISTS team_stage_progress (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id),
    level_id BIGINT NOT NULL REFERENCES levels(id),
    stage_number INTEGER NOT NULL,
    player1_completed BOOLEAN NOT NULL DEFAULT FALSE,
    player2_completed BOOLEAN NOT NULL DEFAULT FALSE,
    discovery_key VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_stage_progress UNIQUE (team_id, level_id, stage_number)
);

CREATE TABLE IF NOT EXISTS discovery_submissions (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id),
    level_id BIGINT NOT NULL REFERENCES levels(id),
    player_id BIGINT NOT NULL REFERENCES players(id),
    stage_number INTEGER NOT NULL,
    discovery_value_hash VARCHAR(128) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_discovery_submission UNIQUE (team_id, level_id, stage_number, player_id)
);

CREATE TABLE IF NOT EXISTS hint_usage (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id),
    level_id BIGINT NOT NULL REFERENCES levels(id),
    stage_number INTEGER NOT NULL,
    hint_number INTEGER NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hint_usage UNIQUE (team_id, level_id, stage_number, hint_number)
);
