-- V47: Reset team start timestamps and deadlines so all active escape simulations receive a fresh 90-minute countdown

-- 1. Reset started_at to CURRENT_TIMESTAMP for all teams currently IN_PROGRESS
UPDATE teams
SET started_at = CURRENT_TIMESTAMP,
    total_story_pause_seconds = 0,
    story_paused_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE game_state = 'IN_PROGRESS';

-- 2. Ensure NOT_STARTED teams have clean null started_at
UPDATE teams
SET started_at = NULL,
    total_story_pause_seconds = 0,
    story_paused_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE game_state = 'NOT_STARTED';

-- 3. Ensure active events have current start_time
UPDATE events
SET start_time = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('READY', 'RUNNING');
