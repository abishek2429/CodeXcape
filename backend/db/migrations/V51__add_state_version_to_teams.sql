-- V51: Add state_version column for authoritative sequence / version protection
ALTER TABLE teams ADD COLUMN IF NOT EXISTS state_version INT NOT NULL DEFAULT 1;
