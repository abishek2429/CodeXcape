UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=hex-to-text'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=shift-3'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=network-graph'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=trace-timeline'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=packet-reassembly'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-board'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-chain'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=pattern-extraction'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=dual-key'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=sequence-reconstruction'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2;

UPDATE questions
SET validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=final-protocol'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3;
