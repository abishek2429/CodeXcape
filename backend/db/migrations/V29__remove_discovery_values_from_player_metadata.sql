UPDATE questions
SET puzzle_metadata = regexp_replace(puzzle_metadata, ',"discovery":"[^"]*"', '', 'g')
WHERE puzzle_metadata IS NOT NULL;
