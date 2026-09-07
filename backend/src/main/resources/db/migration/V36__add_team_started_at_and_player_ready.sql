-- Add started_at timestamp to teams to authoritatively record when team began the event
ALTER TABLE teams ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;

-- Add is_ready boolean to players for pre-game team lobby coordination
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;
