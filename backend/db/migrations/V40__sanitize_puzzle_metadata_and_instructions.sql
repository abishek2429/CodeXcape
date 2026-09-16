-- V40: Sanitize puzzle metadata and instructions to eliminate answer leaks and passkey exposure
-- 1. Remove all 'discovery' keys from puzzle_metadata across all questions
UPDATE questions
SET puzzle_metadata = regexp_replace(
    regexp_replace(puzzle_metadata, ',\s*"discovery"\s*:\s*"[^"]*"', '', 'g'),
    '"discovery"\s*:\s*"[^"]*",?', '', 'g'
)
WHERE puzzle_metadata IS NOT NULL;

-- 2. Level 6 Stage 3 (Final Protocol): Sanitize instructions so Player 2 does not leak master passkey [849201]
UPDATE questions
SET instructions = 'Calculate your three assigned digits (Positions 2, 4, 6). Player 1 holds the derivation for Positions 1, 3, and 5. Interleave all 6 digits in alternating order (Pos 1 through 6) with your teammate to derive the master 6-digit access passkey. Enter the access code to authorize final escape.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6)
  AND stage_number = 3
  AND player_number = 'PLAYER_2';

-- 3. Level 6 Stage 2 (Core Reconstruction): Remove full sequence spoon-feeding from Player 2 evidence and instructions
UPDATE questions
SET evidence = 'DEPENDENCY PROTOCOL (EVEN EDGES):
2. Level 3 Route (A-B-C) -> selects Level 3 Packet (03)
4. Level 2 Transform (HEX-TO-TEXT) -> verifies Level 4 Cipher (SHIFT-3)
6. Level 5 Evidence Chain -> extracts Level 5 Pattern (Fragment 05)',
    instructions = 'Synthesize your even dependency edges with Player 1 odd dependency edges to reconstruct the complete 6-stage master sequence. Validate the unified sequence and submit the verified core sequence.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6)
  AND stage_number = 2
  AND player_number = 'PLAYER_2';

UPDATE questions
SET instructions = 'Synthesize your odd dependency edges with Player 2 even dependency edges to reconstruct the complete 6-stage master sequence. Validate the unified sequence and submit the verified core sequence.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6)
  AND stage_number = 2
  AND player_number = 'PLAYER_1';

-- 4. Level 1 Stage 2 (Access Panel): Remove combination spoon-feeding from Player 2 instructions
UPDATE questions
SET instructions = 'Confirm the three-part selection with Player 1 based on channel ownership and abnormal state change. Submit the recovery fragment once both consoles agree.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1)
  AND stage_number = 2
  AND player_number = 'PLAYER_2';

-- 5. Level 3 Stage 2 (Trace Connection): Remove answer from instructions
UPDATE questions
SET instructions = 'Track communications along the reconstructed route. Identify the suspicious transmission hop with your teammate and submit the isolated packet path discovery.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3)
  AND stage_number = 2
  AND player_number = 'PLAYER_1';

UPDATE questions
SET instructions = 'Compare timestamps and payload indicators with Player 1. Isolate the anomalous packet path with your teammate and submit the packet path discovery.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3)
  AND stage_number = 2
  AND player_number = 'PLAYER_2';

-- 6. Level 4 Stage 1 (Cipher Discovery): Remove answer from instructions
UPDATE questions
SET instructions = 'Infer the transformation family and offset parameter. Compare observations with your teammate to submit the shared cipher discovery.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4)
  AND stage_number = 1;

-- 7. Level 5 Stage 1 (Evidence Board): Remove answer from instructions
UPDATE questions
SET instructions = 'Connect artifacts sharing identical time windows and security identifiers. Correlate with your teammate to submit the verified incident chain discovery.'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5)
  AND stage_number = 1;
