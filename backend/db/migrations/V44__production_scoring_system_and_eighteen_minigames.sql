-- V44: Production Scoring, Penalty, Progress and 18-Minigame Infrastructure

-- 1. Add authoritative scoring and progress columns to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS base_score INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS wrong_attempt_penalty INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS hint_penalty INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS anti_cheat_penalty INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS final_score INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS completed_mini_games INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS completed_levels INT NOT NULL DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS security_incident_count INT NOT NULL DEFAULT 0;

-- 2. Create immutable auditable score events ledger
CREATE TABLE IF NOT EXISTS score_events (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    points_delta INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_score_events_team ON score_events(team_id);
CREATE INDEX IF NOT EXISTS idx_score_events_ref ON score_events(team_id, reference_id);
CREATE INDEX IF NOT EXISTS idx_teams_ranking ON teams(game_state, completed_mini_games DESC, final_score DESC, completed_at ASC, id ASC);

-- 3. Seed Stage 3 for Levels 1, 2, and 4 so all 6 levels have exactly 3 mini-games (18 total)
-- Level 1 Stage 3
INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_1',
       'SYSTEM INTEGRITY VERIFICATION: Level 1 Node N-4 and Process relay have successfully aligned. Memory segment M-17 confirms recovery buffer ready for sealing.',
       'Verify memory segment M-17 with Player 2. Submit the shared discovery to seal Level 1: RECOVERY 01 SEALED',
       'LEVEL 1 / STAGE 3: SYSTEM SEAL', 'RECOVERY 01 SEALED', 'TEXT', true, 'SYSTEMS', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"system-seal"}'
FROM levels l WHERE l.level_number = 1
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_1');

INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_2',
       'SYSTEM INTEGRITY VERIFICATION: Channel K transaction buffer is locked. Memory segment M-17 matches Player 1 telemetry.',
       'Verify memory segment M-17 with Player 1. Submit the shared discovery to seal Level 1: RECOVERY 01 SEALED',
       'LEVEL 1 / STAGE 3: SYSTEM SEAL', 'RECOVERY 01 SEALED', 'TEXT', true, 'SYSTEMS', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"system-seal"}'
FROM levels l WHERE l.level_number = 1
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_2');

-- Level 2 Stage 3
INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_1',
       'DATA VAULT SEAL: Decoded ASCII string RECOVERY is verified. Cryptographic hash boundary confirms block integrity.',
       'Confirm hash boundary with Player 2 and submit the seal discovery: RECOVERY 02 SEALED',
       'LEVEL 2 / STAGE 3: DATA SEAL', 'RECOVERY 02 SEALED', 'TEXT', true, 'DATA-RECONSTRUCTION', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"data-seal"}'
FROM levels l WHERE l.level_number = 2
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_1');

INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_2',
       'DATA VAULT SEAL: 8-byte ASCII payload aligns with vault register. Cryptographic hash boundary confirmed.',
       'Confirm hash boundary with Player 1 and submit the seal discovery: RECOVERY 02 SEALED',
       'LEVEL 2 / STAGE 3: DATA SEAL', 'RECOVERY 02 SEALED', 'TEXT', true, 'DATA-RECONSTRUCTION', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"data-seal"}'
FROM levels l WHERE l.level_number = 2
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_2');

-- Level 4 Stage 3
INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_1',
       'CIPHER CHAMBER SEAL: Plaintext message HELLO WORLD confirmed with displacement 3. Keystone validation ready.',
       'Verify keystone with Player 2 and submit the seal discovery: RECOVERY 04 SEALED',
       'LEVEL 4 / STAGE 3: CIPHER SEAL', 'RECOVERY 04 SEALED', 'TEXT', true, 'DECRYPTION', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"cipher-seal"}'
FROM levels l WHERE l.level_number = 4
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_1');

INSERT INTO questions (level_id, stage_number, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty, validation_rules, puzzle_metadata)
SELECT l.id, 3, 'PLAYER_2',
       'CIPHER CHAMBER SEAL: Keystone parameter aligns with 2-word plaintext. Keystone validation ready.',
       'Verify keystone with Player 1 and submit the seal discovery: RECOVERY 04 SEALED',
       'LEVEL 4 / STAGE 3: CIPHER SEAL', 'RECOVERY 04 SEALED', 'TEXT', true, 'DECRYPTION', 'MEDIUM', 'NORMALIZED_TEXT_EXACT', '{"interaction":"cipher-seal"}'
FROM levels l WHERE l.level_number = 4
AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.level_id = l.id AND q.stage_number = 3 AND q.player_number = 'PLAYER_2');

-- Seed hints for Level 1, 2, 4 Stage 3
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Confirm the verified recovery output from the preceding stage with your teammate.', 1, true
FROM levels l WHERE l.level_number IN (1, 2, 4)
AND NOT EXISTS (SELECT 1 FROM hints h WHERE h.level_id = l.id AND h.stage_number = 3 AND h.display_order = 1);

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Check the seal format required by both consoles: RECOVERY 0X SEALED.', 2, true
FROM levels l WHERE l.level_number IN (1, 2, 4)
AND NOT EXISTS (SELECT 1 FROM hints h WHERE h.level_id = l.id AND h.stage_number = 3 AND h.display_order = 2);

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Submit the exact uppercase seal discovery agreed upon by both consoles.', 3, true
FROM levels l WHERE l.level_number IN (1, 2, 4)
AND NOT EXISTS (SELECT 1 FROM hints h WHERE h.level_id = l.id AND h.stage_number = 3 AND h.display_order = 3);

-- Remove fixed IDs 1000, 1001, 1002 to eliminate autoincrement identity sequence collisions
DELETE FROM score_events WHERE team_id IN (1000, 1001, 1002);
DELETE FROM team_anti_cheat_summary WHERE team_id IN (1000, 1001, 1002);
DELETE FROM anti_cheat_events WHERE team_id IN (1000, 1001, 1002);
DELETE FROM answer_attempts WHERE team_id IN (1000, 1001, 1002);
DELETE FROM discovery_submissions WHERE team_id IN (1000, 1001, 1002);
DELETE FROM team_stage_progress WHERE team_id IN (1000, 1001, 1002);
DELETE FROM team_level_progress WHERE team_id IN (1000, 1001, 1002);
DELETE FROM game_sessions WHERE team_id IN (1000, 1001, 1002);
DELETE FROM hint_usage WHERE team_id IN (1000, 1001, 1002);
DELETE FROM game_events WHERE team_id IN (1000, 1001, 1002);
DELETE FROM players WHERE team_id IN (1000, 1001, 1002);
DELETE FROM teams WHERE id IN (1000, 1001, 1002);

-- Re-insert clean demo team without fixed ID collision
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT e.id, 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM events e ORDER BY e.id LIMIT 1;

INSERT INTO players (team_id, player_number, display_name, status, is_active, is_ready, created_at, updated_at)
SELECT t.id, 1, 'Alpha Player 1', 'INACTIVE', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM teams t WHERE t.team_code = 'TEAM-ALPHA' ORDER BY t.id DESC LIMIT 1;

INSERT INTO players (team_id, player_number, display_name, status, is_active, is_ready, created_at, updated_at)
SELECT t.id, 2, 'Alpha Player 2', 'INACTIVE', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM teams t WHERE t.team_code = 'TEAM-ALPHA' ORDER BY t.id DESC LIMIT 1;



