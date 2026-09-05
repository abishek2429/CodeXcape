INSERT INTO hints (level_id, hint_content, display_order, is_active, created_at, updated_at)
SELECT l.id, 'Hint 2: compare the ordering or relationship, then remove the unconfirmed option.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM levels l
WHERE l.level_number BETWEEN 1 AND 6
  AND NOT EXISTS (SELECT 1 FROM hints h WHERE h.level_id = l.id AND h.display_order = 2);

INSERT INTO hints (level_id, hint_content, display_order, is_active, created_at, updated_at)
SELECT l.id, 'Hint 3: state the shared discovery in the format accepted by both player consoles.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM levels l
WHERE l.level_number BETWEEN 1 AND 6
  AND NOT EXISTS (SELECT 1 FROM hints h WHERE h.level_id = l.id AND h.display_order = 3);