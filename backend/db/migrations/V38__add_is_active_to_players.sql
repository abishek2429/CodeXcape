-- Migration V38: Add is_active account eligibility column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE players SET is_active = true WHERE is_active IS NULL;
