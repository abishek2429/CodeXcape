-- V48: Update timer to 100 minutes and ensure exact 15-stage configuration across all 6 levels
-- Level 1: 2 stages
-- Level 2: 2 stages
-- Level 3: 2 stages
-- Level 4: 3 stages
-- Level 5: 3 stages
-- Level 6: 3 stages
-- Total: 15 stages

-- 1. Ensure Stage 1 and Stage 2 questions are active for all 6 levels
UPDATE questions
SET is_active = true
WHERE stage_number IN (1, 2)
  AND level_id IN (SELECT id FROM levels WHERE level_number BETWEEN 1 AND 6);

-- 2. Deactivate Stage 3 questions for Levels 1, 2, and 3
UPDATE questions
SET is_active = false
WHERE stage_number = 3
  AND level_id IN (SELECT id FROM levels WHERE level_number IN (1, 2, 3));

-- 3. Ensure Stage 3 questions are active for Levels 4, 5, and 6
UPDATE questions
SET is_active = true
WHERE stage_number = 3
  AND level_id IN (SELECT id FROM levels WHERE level_number IN (4, 5, 6));

-- 4. Clean up any invalid stage 3 progress rows on levels 1, 2, 3
DELETE FROM team_stage_progress
WHERE stage_number = 3
  AND level_id IN (SELECT id FROM levels WHERE level_number IN (1, 2, 3));

-- 5. Ensure hints for Stage 1 and 2 are active for all levels
UPDATE hints
SET is_active = true
WHERE stage_number IN (1, 2)
  AND level_id IN (SELECT id FROM levels WHERE level_number BETWEEN 1 AND 6);

-- 6. Deactivate hints for Stage 3 on levels 1, 2, 3
UPDATE hints
SET is_active = false
WHERE stage_number = 3
  AND level_id IN (SELECT id FROM levels WHERE level_number IN (1, 2, 3));

-- 7. Ensure hints for Stage 3 on levels 4, 5, 6 are active
UPDATE hints
SET is_active = true
WHERE stage_number = 3
  AND level_id IN (SELECT id FROM levels WHERE level_number IN (4, 5, 6));
