-- V54: Update Riddle 5 expected digit to '3' and final passkey to '382439'

-- Update events passkey_hash to bcrypt hash of '382439'
UPDATE events
SET passkey_hash = '$2a$10$S2JpCzU2db1QO16yiqa7QO5ErNMF0J4LU3AjUiUJef4HPisz8sne6',
    updated_at = NOW()
WHERE id = (SELECT id FROM events ORDER BY id LIMIT 1);
