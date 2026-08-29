CREATE TABLE hints (
    id BIGSERIAL PRIMARY KEY,
    level_id BIGINT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    hint_content TEXT NOT NULL,
    display_order INT DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_hints_level_id ON hints(level_id);
CREATE INDEX uq_hints_level_active ON hints(level_id);
