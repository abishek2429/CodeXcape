-- V46: Configure exact stage counts per user specification:
-- Level 1: 2 stages
-- Level 2: 2 stages
-- Level 3: 2 stages
-- Level 4: 3 stages
-- Level 5: 3 stages
-- Level 6: 3 stages
-- Total: 15 stages across all 6 levels

-- 1. Deactivate Stage 3 questions for Levels 1, 2, and 3
UPDATE questions SET is_active = false
WHERE stage_number = 3
AND level_id IN (
    SELECT id FROM levels WHERE level_number IN (1, 2, 3)
);

-- 2. Ensure Stage 1 and Stage 2 questions are active for all levels (1 through 6)
UPDATE questions SET is_active = true
WHERE stage_number IN (1, 2)
AND level_id IN (
    SELECT id FROM levels WHERE level_number BETWEEN 1 AND 6
);

-- 3. Ensure Stage 3 questions are active for Levels 4, 5, and 6
UPDATE questions SET is_active = true
WHERE stage_number = 3
AND level_id IN (
    SELECT id FROM levels WHERE level_number IN (4, 5, 6)
);

-- 4. Clean up any existing team_stage_progress rows for deactivated Stage 3 on levels 1, 2, 3
DELETE FROM team_stage_progress
WHERE stage_number = 3
AND level_id IN (
    SELECT id FROM levels WHERE level_number IN (1, 2, 3)
);

-- 5. Deactivate hints for Stage 3 on levels 1, 2, 3
UPDATE hints SET is_active = false
WHERE stage_number = 3
AND level_id IN (
    SELECT id FROM levels WHERE level_number IN (1, 2, 3)
);

-- 6. Ensure hints for Stage 3 on levels 4, 5, 6 are active
UPDATE hints SET is_active = true
WHERE stage_number = 3
AND level_id IN (
    SELECT id FROM levels WHERE level_number IN (4, 5, 6)
);
