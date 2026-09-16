UPDATE questions
SET puzzle_metadata = '{"interaction":"timeline","items":["relay-ready","watcher-rejected","relay-retry","archive-read"]}',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline;ORDER=relay-ready|watcher-rejected|relay-retry|archive-read'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions
SET puzzle_metadata = '{"interaction":"component-map","items":["channel-K","channel-R","owner-relay","owner-archive"]}',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=component-map;ORDER=channel-K|owner-relay|channel-R|owner-archive'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_2';

UPDATE questions
SET puzzle_metadata = '{"interaction":"fragment-assembly","items":["C3","B7","41"]}',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly;ORDER=C3|B7|41'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1;
