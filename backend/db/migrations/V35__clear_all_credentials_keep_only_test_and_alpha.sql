-- V35: Clear all teams/credentials except CODEXCAPE-TEST and TEAM-ALPHA, reset game state, and harmonize 15 stages.

-- 0. Ensure schema columns are synchronized
ALTER TABLE hints ADD COLUMN IF NOT EXISTS stage_number INT DEFAULT 1 NOT NULL;
ALTER TABLE players DROP CONSTRAINT IF EXISTS chk_players_player_number;
ALTER TABLE players ADD CONSTRAINT chk_players_player_number CHECK (player_number IN (1, 2));

-- 1. Ensure or update primary active event
INSERT INTO events (name, description, status, passkey_hash, created_at, updated_at)
SELECT 'College Technical Fest - CodeXcape Official Event', 'CodeXcape Two-Player Cooperative Escape Room', 'READY', '$2a$10$wE/.76o.xO4d3V1Fq5Q1nO.1nFk1v5q2e4R/2hW2/8kU1G2A0B7mK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name LIKE '%College Technical Fest%' OR name LIKE '%CodeXcape%');

UPDATE events
SET name = 'College Technical Fest - CodeXcape Official Event',
    status = 'READY',
    passkey_hash = '$2a$10$wE/.76o.xO4d3V1Fq5Q1nO.1nFk1v5q2e4R/2hW2/8kU1G2A0B7mK',
    updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM events WHERE name LIKE '%College Technical Fest%' OR name LIKE '%CodeXcape%' ORDER BY id LIMIT 1);

-- 2. Purge all data for any team other than CODEXCAPE-TEST and TEAM-ALPHA
DELETE FROM answer_attempts WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM discovery_submissions WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM team_stage_progress WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM team_level_progress WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM game_sessions WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM hint_usage WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM players WHERE team_id IN (SELECT id FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM teams WHERE team_code NOT IN ('CODEXCAPE-TEST', 'TEAM-ALPHA');

-- 3. Reset existing progress for CODEXCAPE-TEST and TEAM-ALPHA so both start fresh
DELETE FROM answer_attempts WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM discovery_submissions WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM team_stage_progress WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM team_level_progress WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM game_sessions WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));
DELETE FROM hint_usage WHERE team_id IN (SELECT id FROM teams WHERE team_code IN ('CODEXCAPE-TEST', 'TEAM-ALPHA'));

-- 4. Ensure CODEXCAPE-TEST exists and is linked to the event
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'CODEXCAPE-TEST', 'CodeXcape Test Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'CODEXCAPE-TEST');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'CODEXCAPE-TEST';

-- Ensure Player 1 and Player 2 for CODEXCAPE-TEST
INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 1, 'Test Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1), 2, 'Test Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1) AND player_number = 2);

UPDATE players SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
WHERE team_id = (SELECT id FROM teams WHERE team_code = 'CODEXCAPE-TEST' ORDER BY id LIMIT 1);

-- 5. Ensure TEAM-ALPHA exists and is linked to the event
INSERT INTO teams (event_id, team_code, team_name, status, game_state, created_at, updated_at)
SELECT (SELECT id FROM events ORDER BY id LIMIT 1), 'TEAM-ALPHA', 'Alpha Team', 'REGISTERED', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE team_code = 'TEAM-ALPHA');

UPDATE teams
SET event_id = (SELECT id FROM events ORDER BY id LIMIT 1),
    status = 'REGISTERED',
    game_state = 'NOT_STARTED',
    completed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE team_code = 'TEAM-ALPHA';

-- Ensure Player 1 and Player 2 for TEAM-ALPHA
INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 1, 'Alpha Player 1', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 1);

INSERT INTO players (team_id, player_number, display_name, status, created_at, updated_at)
SELECT (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1), 2, 'Alpha Player 2', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM players WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1) AND player_number = 2);

UPDATE players SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
WHERE team_id = (SELECT id FROM teams WHERE team_code = 'TEAM-ALPHA' ORDER BY id LIMIT 1);

-- 6. Ensure exactly 6 active levels exist with neutral names and descriptions
UPDATE levels SET name = 'SYSTEM RECONSTRUCTION', description = 'Reconstruct a system event chain from asymmetric logs and component relationships.', is_active = true WHERE level_number = 1;
UPDATE levels SET name = 'DATA VAULT', description = 'Reassemble fragmented data and identify the transformation that makes it readable.', is_active = true WHERE level_number = 2;
UPDATE levels SET name = 'NETWORK INCIDENT', description = 'Reconstruct a route, isolate suspicious traffic, and recover a damaged packet.', is_active = true WHERE level_number = 3;
UPDATE levels SET name = 'ENCRYPTED ROOM', description = 'Infer a transformation from behavior, ordering, and reset evidence.', is_active = true WHERE level_number = 4;
UPDATE levels SET name = 'COLLAPSED SYSTEM', description = 'Correlate forensic artifacts, follow an evidence chain, and extract a hidden pattern.', is_active = true WHERE level_number = 5;
UPDATE levels SET name = 'THE CORE', description = 'Combine the mechanisms learned across the game into a final protocol.', is_active = true WHERE level_number = 6;

-- 7. Update all 15 stages (30 question records) with exact production puzzle content and deterministic solutions

-- LEVEL 1 STAGE 1: LOG COLLISION
UPDATE questions SET
    evidence = 'LOG STREAM A:
08:14:02 process=relay pid=17 status=READY channel=K
08:14:11 process=watcher pid=04 status=REJECTED channel=K
08:14:19 process=relay pid=17 status=RETRY channel=K
08:14:27 process=archive pid=88 status=READ channel=R

LOG STREAM B:
08:13:58 process=archive pid=88 status=READ channel=R
08:14:11 process=watcher pid=04 status=REJECTED channel=K

DECOY LOG:
09:02:44 process=backup pid=99 status=COMPLETE channel=R',
    instructions = 'Sort the records by timestamp. Ignore the later maintenance decoy event. The abnormal event is the process that changes state twice (abnormal retry). Correlate the channel and abnormal PID with your teammate to derive the system trace label.',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOG COLLISION',
    expected_answer_hash = 'SYSTEM TRACE: K-17',
    answer_type = 'TEXT',
    technical_category = 'SEQUENCING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline',
    puzzle_metadata = '{"interaction":"timeline","discovery":"SYSTEM TRACE: K-17","decoys":["backup"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'COMPONENT TOPOLOGY & CHANNEL MAP:
- relay: owns channel K (active transaction pipeline)
- watcher: monitors channel K (observer mode)
- archive: stores channel R (storage volume)

CHANNEL OWNERSHIP RULES:
- An abnormal retry remains bound to its assigned channel.
- A rejected watcher event does not alter channel ownership.

DECOY COMPONENT:
- backup: attached to channel R (routine snapshot)',
    instructions = 'Review the component map and ownership rules. Use the abnormal process event identified by Player 1 to determine the exact SYSTEM TRACE label (channel name and abnormal process ID). Submit the shared discovery.',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOG COLLISION',
    expected_answer_hash = 'SYSTEM TRACE: K-17',
    answer_type = 'TEXT',
    technical_category = 'CORRELATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline',
    puzzle_metadata = '{"interaction":"component-map","discovery":"SYSTEM TRACE: K-17","decoys":["backup"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 1 STAGE 2: ACCESS PANEL
UPDATE questions SET
    evidence = 'ACCESS PANEL CANDIDATE CONTROLS:
- NODE SELECTOR: [N-2, N-4, N-7]
- PROCESS SELECTOR: [relay, watcher, archive]
- SEQUENCE SELECTOR: [K-17, R-03, M-22]

ACTIVATION CRITERIA:
The panel accepts:
1. The node bound to the abnormal channel identified in Stage 1.
2. The process that performed the retry.
3. The verified system trace label.',
    instructions = 'Select the correct Node, Process, and Sequence using the Stage 1 discovery. Coordinate with your teammate to verify selections, then submit RECOVERY FRAGMENT 01.',
    puzzle_context = 'LEVEL 1 / STAGE 2: ACCESS PANEL',
    expected_answer_hash = 'RECOVERY FRAGMENT 01',
    answer_type = 'TEXT',
    technical_category = 'SYSTEMS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=access-panel',
    puzzle_metadata = '{"interaction":"access-panel","nodes":["N-2","N-4","N-7"],"processes":["relay","watcher","archive"],"sequences":["K-17","R-03","M-22"],"discovery":"RECOVERY FRAGMENT 01"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'ACCESS PANEL CONFIGURATION MATRIX:
- Channel K is hosted on Node N-4.
- Channel R is hosted on Node N-7.
- Channel M is hosted on Node N-2.

VERIFICATION RULES:
- Node: selected by channel ownership (channel K -> Node N-4)
- Process: selected by the abnormal retry (process relay)
- Sequence: selected by the Stage 1 trace (K-17)',
    instructions = 'Confirm the three-part combination with Player 1 (Node N-4, process relay, trace K-17). Submit RECOVERY FRAGMENT 01.',
    puzzle_context = 'LEVEL 1 / STAGE 2: ACCESS PANEL',
    expected_answer_hash = 'RECOVERY FRAGMENT 01',
    answer_type = 'TEXT',
    technical_category = 'SYSTEMS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=access-panel',
    puzzle_metadata = '{"interaction":"access-panel","nodes":["N-2","N-4","N-7"],"processes":["relay","watcher","archive"],"sequences":["K-17","R-03","M-22"],"discovery":"RECOVERY FRAGMENT 01"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 2 STAGE 1: FRAGMENT VAULT
UPDATE questions SET
    evidence = 'FRAGMENT VAULT - ARTIFACT SET A:
- Fragment [B7]: ends with boundary marker 2F
- Fragment [41]: begins with boundary marker 7B
- Fragment [C3]: followed by boundary marker 2F
- Decoy Fragment [99]: boundary marker checksum invalid',
    instructions = 'Match fragment boundary markers with your teammate sequence constraints. Eliminate the decoy [99] and determine the valid byte representation.',
    puzzle_context = 'LEVEL 2 / STAGE 1: FRAGMENT VAULT',
    expected_answer_hash = 'HEX-TO-TEXT',
    answer_type = 'TEXT',
    technical_category = 'DATA-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly',
    puzzle_metadata = '{"interaction":"fragment-assembly","items":["Fragment [B7]","Fragment [41]","Fragment [C3]"],"discovery":"HEX-TO-TEXT","decoy":"99"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'FRAGMENT VAULT - ARTIFACT SET B:
- Valid Boundary Chain: [C3] -> [B7] -> [41]
- Checksum marker aligns only after the third byte fragment [41].
- Representation: The 2-character hexadecimal byte fragments map to raw computer bytes.
- Decoy Fragment [D0]: unlinked orphan byte.',
    instructions = 'Use the boundary order and your teammate evidence to identify which representation the recovered bytes use. Submit the shared transformation discovery.',
    puzzle_context = 'LEVEL 2 / STAGE 1: FRAGMENT VAULT',
    expected_answer_hash = 'HEX-TO-TEXT',
    answer_type = 'TEXT',
    technical_category = 'DATA-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly',
    puzzle_metadata = '{"interaction":"fragment-assembly","items":["Fragment [C3]","Fragment [B7]","Fragment [41]"],"discovery":"HEX-TO-TEXT","decoy":"D0"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 2 STAGE 2: TRANSFORMATION CHAMBER
UPDATE questions SET
    evidence = 'TRANSFORMATION CHAMBER:
Recovered Byte Stream: 52 45 43 4F 56 45 52 59

AVAILABLE TRANSFORMATION ENGINES:
- decimal-to-text
- hex-to-text
- reverse-bytes
- base64-decode',
    instructions = 'Select the transformation engine discovered in Stage 1 (hex-to-text). Process the recovered byte stream and verify the readable English output with your teammate.',
    puzzle_context = 'LEVEL 2 / STAGE 2: TRANSFORMATION CHAMBER',
    expected_answer_hash = 'RECOVERY FRAGMENT 02',
    answer_type = 'TEXT',
    technical_category = 'TRANSFORMATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=hex-to-text',
    puzzle_metadata = '{"interaction":"transformation","operations":["decimal-to-text","hex-to-text","reverse-bytes","base64-decode"],"discovery":"RECOVERY FRAGMENT 02"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'BYTE INTERPRETATION MATRIX:
Hexadecimal pairs map to readable ASCII characters:
52 -> ''R''
45 -> ''E''
43 -> ''C''
4F -> ''O''
56 -> ''V''
45 -> ''E''
52 -> ''R''
59 -> ''Y''
Plaintext result: ''RECOVERY'' (8 characters).',
    instructions = 'Verify the decoded result with Player 1. Submit RECOVERY FRAGMENT 02.',
    puzzle_context = 'LEVEL 2 / STAGE 2: TRANSFORMATION CHAMBER',
    expected_answer_hash = 'RECOVERY FRAGMENT 02',
    answer_type = 'TEXT',
    technical_category = 'TRANSFORMATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=hex-to-text',
    puzzle_metadata = '{"interaction":"transformation","discovery":"RECOVERY FRAGMENT 02"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 3 STAGE 1: NETWORK RECONSTRUCTION
UPDATE questions SET
    evidence = 'LOCAL INGRESS TOPOLOGY:
- Confirmed Edges: [A -> B] and [B -> C]
- Unverified Candidate Edges: [A -> D], [C -> D], [B -> D]
- Source Node: Node A',
    instructions = 'Compare your confirmed edges with Player 2 egress edges. Discard candidate decoys and submit the mutually confirmed route label.',
    puzzle_context = 'LEVEL 3 / STAGE 1: NETWORK RECONSTRUCTION',
    expected_answer_hash = 'ROUTE A-B-C',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=network-graph',
    puzzle_metadata = '{"interaction":"network-graph","discovery":"ROUTE A-B-C"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'REMOTE EGRESS TOPOLOGY:
- Confirmed Edges: [B -> C] and [C -> E]
- Unverified Candidate Edges: [A -> E], [A -> D], [B -> D]
- Destination Target: Node E',
    instructions = 'Combine confirmed links with Player 1 to establish the verified network route from source to destination. Submit the route label.',
    puzzle_context = 'LEVEL 3 / STAGE 1: NETWORK RECONSTRUCTION',
    expected_answer_hash = 'ROUTE A-B-C',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=network-graph',
    puzzle_metadata = '{"interaction":"network-graph","discovery":"ROUTE A-B-C"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 3 STAGE 2: TRACE THE CONNECTION
UPDATE questions SET
    evidence = 'NETWORK FLOW CAPTURE A:
- 10:02:01 [A -> B] SYN-ACK // CONNECT (Normal)
- 10:02:03 [B -> C] ROUTE_RELAY // FORWARD (Normal)
- 10:02:04 [C -> E] DATA_BURST // FORWARD (Payload: 0x504B)
- 10:02:09 [A -> D] PROBE // DROP (Decoy)',
    instructions = 'Track communications along the reconstructed route. Identify the suspicious transmission hop and submit PACKET PATH C-E.',
    puzzle_context = 'LEVEL 3 / STAGE 2: TRACE THE CONNECTION',
    expected_answer_hash = 'PACKET PATH C-E',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-FORENSICS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=trace-timeline',
    puzzle_metadata = '{"interaction":"trace-timeline","discovery":"PACKET PATH C-E"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'TRAFFIC ANOMALY REPORT B:
- 10:02:03 [B -> C] FORWARD: legitimate protocol control
- 10:02:04 [C -> E] FORWARD: unexpected binary burst detected
- 10:02:09 [A -> D] DROP: decoy scanning noise',
    instructions = 'Compare timestamps and payload indicators with Player 1. Isolate the anomalous packet path and submit PACKET PATH C-E.',
    puzzle_context = 'LEVEL 3 / STAGE 2: TRACE THE CONNECTION',
    expected_answer_hash = 'PACKET PATH C-E',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-FORENSICS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=trace-timeline',
    puzzle_metadata = '{"interaction":"trace-timeline","discovery":"PACKET PATH C-E"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 3 STAGE 3: PACKET RECOVERY
UPDATE questions SET
    evidence = 'CORRUPTED PACKET SEGMENTS:
- Segment H: Header bytes [50 4B]
- Segment P: Payload bytes [52 45 43 4F]
- Segment C: Checksum bytes [56 45 52 59]
- Decoy Segment X: Noise bytes [99 AA BB] (dropped link A->D)',
    instructions = 'Order valid packet segments (Header, Payload, Checksum). Discard the decoy noise and submit RECOVERY FRAGMENT 03.',
    puzzle_context = 'LEVEL 3 / STAGE 3: PACKET RECOVERY',
    expected_answer_hash = 'RECOVERY FRAGMENT 03',
    answer_type = 'TEXT',
    technical_category = 'PACKET-RECOVERY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=packet-reassembly',
    puzzle_metadata = '{"interaction":"packet-reassembly","items":["Header [50 4B]","Payload [52 45 43 4F]","Checksum [56 45 52 59]"],"discovery":"RECOVERY FRAGMENT 03"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'PACKET REASSEMBLY PROTOCOL:
- Assembly sequence: Header -> Payload -> Checksum
- Reassembled packet payload matches the third recovery artifact.',
    instructions = 'Confirm the valid payload order with Player 1. Submit RECOVERY FRAGMENT 03.',
    puzzle_context = 'LEVEL 3 / STAGE 3: PACKET RECOVERY',
    expected_answer_hash = 'RECOVERY FRAGMENT 03',
    answer_type = 'TEXT',
    technical_category = 'PACKET-RECOVERY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=packet-reassembly',
    puzzle_metadata = '{"interaction":"packet-reassembly","items":["Header [50 4B]","Payload [52 45 43 4F]","Checksum [56 45 52 59]"],"discovery":"RECOVERY FRAGMENT 03"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- LEVEL 4 STAGE 1: CIPHER DISCOVERY
UPDATE questions SET
    evidence = 'CIPHER TELEMETRY LOG A:
Observed character transformations:
''A'' -> ''D'' (+3)
''B'' -> ''E'' (+3)
''M'' -> ''P'' (+3)
Alphabetical distance is preserved across all transformed characters.',
    instructions = 'Infer the transformation family and offset parameter. Compare with your teammate and submit the shared discovery SHIFT-3.',
    puzzle_context = 'LEVEL 4 / STAGE 1: CIPHER DISCOVERY',
    expected_answer_hash = 'SHIFT-3',
    answer_type = 'TEXT',
    technical_category = 'CIPHER-REASONING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=cipher-deduction',
    puzzle_metadata = '{"interaction":"cipher-deduction","discovery":"SHIFT-3"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'CIPHER CONTEXT LOG B:
- Cipher type: Caesar Shift
- Rotation parameter: Uniform alphabetical displacement
- Reset rule: Non-alphabetic boundaries and spaces remain unaltered.',
    instructions = 'Combine the cipher properties with Player 1 offset observations. Submit SHIFT-3.',
    puzzle_context = 'LEVEL 4 / STAGE 1: CIPHER DISCOVERY',
    expected_answer_hash = 'SHIFT-3',
    answer_type = 'TEXT',
    technical_category = 'CIPHER-REASONING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=cipher-deduction',
    puzzle_metadata = '{"interaction":"cipher-deduction","discovery":"SHIFT-3"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 4 STAGE 2: DECRYPTION INTERFACE
UPDATE questions SET
    evidence = 'ENCRYPTED CIPHERTEXT BLOCKS:
Block 1: [KHOOR]
Block 2: [ZRUOG]

CANDIDATE TRANSFORMS:
- shift-1
- shift-3
- reverse
- substitution',
    instructions = 'Select the shift-3 operation discovered in Stage 1. Decrypt the blocks in order and verify the readable English plaintext with Player 2.',
    puzzle_context = 'LEVEL 4 / STAGE 2: DECRYPTION INTERFACE',
    expected_answer_hash = 'RECOVERY FRAGMENT 04',
    answer_type = 'TEXT',
    technical_category = 'DECRYPTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=shift-3',
    puzzle_metadata = '{"interaction":"decryption","operations":["shift-1","shift-3","reverse","substitution"],"discovery":"RECOVERY FRAGMENT 04"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'DECRYPTION VERIFICATION MATRIX:
Applying shift -3 to the ciphertext:
[KHOOR] -> ''HELLO''
[ZRUOG] -> ''WORLD''
Plaintext output: ''HELLO WORLD'' (2 words).',
    instructions = 'Confirm the two-word plaintext with Player 1. Submit RECOVERY FRAGMENT 04.',
    puzzle_context = 'LEVEL 4 / STAGE 2: DECRYPTION INTERFACE',
    expected_answer_hash = 'RECOVERY FRAGMENT 04',
    answer_type = 'TEXT',
    technical_category = 'DECRYPTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=shift-3',
    puzzle_metadata = '{"interaction":"decryption","discovery":"RECOVERY FRAGMENT 04"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 5 STAGE 1: EVIDENCE BOARD
UPDATE questions SET
    evidence = 'FORENSIC ARTIFACTS - DOSSIER A:
- File Record [F-12]: modified at 14:03:00 (Incident Trigger)
- Security Identifier [R-4]: generated at 14:04:00
- Network Broadcast [N-9]: initiated at 14:05:00 references ID [R-4]
- Decoy File [F-88]: routine backup at 12:00:00 (ignore)',
    instructions = 'Connect artifacts sharing identical time windows and security identifiers. Submit CHAIN F-12/R-4/N-9.',
    puzzle_context = 'LEVEL 5 / STAGE 1: EVIDENCE BOARD',
    expected_answer_hash = 'CHAIN F-12/R-4/N-9',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-board',
    puzzle_metadata = '{"interaction":"evidence-board","items":["File [F-12] (14:03)","Identifier [R-4] (14:04)","Network [N-9] (14:05)"],"discovery":"CHAIN F-12/R-4/N-9"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'FORENSIC ARTIFACTS - DOSSIER B:
- Process [P-7]: spawned at 14:04:00, reads Identifier [R-4] from File [F-12]
- Network Socket [N-9]: opened at 14:05:00 by Process [P-7]
- Decoy Process [P-2]: references obsolete ID [R-8] (ignore)',
    instructions = 'Correlate process and socket telemetry with Player 1. Confirm the valid incident chain and submit CHAIN F-12/R-4/N-9.',
    puzzle_context = 'LEVEL 5 / STAGE 1: EVIDENCE BOARD',
    expected_answer_hash = 'CHAIN F-12/R-4/N-9',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-board',
    puzzle_metadata = '{"interaction":"evidence-board","items":["File [F-12] (14:03)","Identifier [R-4] (14:04)","Network [N-9] (14:05)"],"discovery":"CHAIN F-12/R-4/N-9"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 5 STAGE 2: EVIDENCE CHAIN
UPDATE questions SET
    evidence = 'CHAIN TRACE - NODE P-7 ARTIFACTS:
- Linked file points to transformation record [T-3].
- Record [T-3] contains a reference to RECOVERY FRAGMENT 02 recovered in Level 2.
- Decoy record [T-8]: invalid checksum (ignore).',
    instructions = 'Follow the incident chain from Stage 1 into the system archives using Level 2 discoveries. Submit CHAIN VERIFIED.',
    puzzle_context = 'LEVEL 5 / STAGE 2: EVIDENCE CHAIN',
    expected_answer_hash = 'CHAIN VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-chain',
    puzzle_metadata = '{"interaction":"evidence-chain","discovery":"CHAIN VERIFIED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'CHAIN CROSS-LEVEL VERIFICATION B:
- Record [T-3] is verified: its hash matches RECOVERY FRAGMENT 02 from Level 2.
- The forensic link between Level 2 and Node N-9 is established.',
    instructions = 'Confirm the cross-level evidence link with Player 1. Submit CHAIN VERIFIED.',
    puzzle_context = 'LEVEL 5 / STAGE 2: EVIDENCE CHAIN',
    expected_answer_hash = 'CHAIN VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-chain',
    puzzle_metadata = '{"interaction":"evidence-chain","discovery":"CHAIN VERIFIED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 5 STAGE 3: PATTERN EXTRACTION
UPDATE questions SET
    evidence = 'RAW TELEMETRY STREAM (10 SYMBOLS):
Pos 1: [X] (Decoy)
Pos 2: [R] (Valid)
Pos 3: [Q] (Decoy)
Pos 4: [E] (Valid)
Pos 5: [Z] (Decoy)
Pos 6: [C] (Valid)
Pos 7: [W] (Decoy)
Pos 8: [0] (Valid)
Pos 9: [M] (Decoy)
Pos 10: [5] (Decoy)

EXTRACTION RULE:
Filter to only even index positions: [2, 4, 6, 8].
All odd index positions are decoy noise.',
    instructions = 'Apply the even-position extraction rule [2, 4, 6, 8] to eliminate decoy noise. Share the filtered positions with Player 2 to submit RECOVERY FRAGMENT 05.',
    puzzle_context = 'LEVEL 5 / STAGE 3: PATTERN EXTRACTION',
    expected_answer_hash = 'RECOVERY FRAGMENT 05',
    answer_type = 'TEXT',
    technical_category = 'PATTERN-RECOGNITION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=pattern-extraction',
    puzzle_metadata = '{"interaction":"pattern-extraction","items":["Pos 2: R","Pos 4: E","Pos 6: C","Pos 8: 0"],"discovery":"RECOVERY FRAGMENT 05"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'PATTERN INTERPRETATION KEY:
- Extraction rule: Select even positions [2, 4, 6, 8] from the stream.
- Target output: Extracted symbols confirm the final forensic marker: RECOVERY FRAGMENT 05.
- Decoy noise: Odd positions [1, 3, 5, 7, 9, 10] contain misleading interference.',
    instructions = 'Verify the even-position extraction with Player 1. Submit RECOVERY FRAGMENT 05.',
    puzzle_context = 'LEVEL 5 / STAGE 3: PATTERN EXTRACTION',
    expected_answer_hash = 'RECOVERY FRAGMENT 05',
    answer_type = 'TEXT',
    technical_category = 'PATTERN-RECOGNITION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=pattern-extraction',
    puzzle_metadata = '{"interaction":"pattern-extraction","items":["Pos 2: R","Pos 4: E","Pos 6: C","Pos 8: 0"],"discovery":"RECOVERY FRAGMENT 05"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- LEVEL 6 STAGE 1: DUAL KEY
UPDATE questions SET
    evidence = 'CORE KEY COMPONENT ALPHA:
- Key Shard A: [ALPHA-77-PRIME]
- Protocol Constraint: Core Key A unlocks the primary authorization interlock.
- Synchronization Requirement: Core Key A must be engaged concurrently with Core Key B.',
    instructions = 'Review Core Key Alpha. Communicate readiness with Player 2 to engage both keys simultaneously on the dual authorization console. Submit CORE ACCESS GRANTED.',
    puzzle_context = 'LEVEL 6 / STAGE 1: DUAL KEY',
    expected_answer_hash = 'CORE ACCESS GRANTED',
    answer_type = 'TEXT',
    technical_category = 'PROTOCOL-RECONSTRUCTION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=dual-key',
    puzzle_metadata = '{"interaction":"dual-key","discovery":"CORE ACCESS GRANTED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'CORE KEY COMPONENT BETA:
- Key Shard B: [BETA-88-SECUNDUS]
- Protocol Constraint: Core Key B unlocks the secondary authorization interlock.
- Synchronization Requirement: Both nodes must confirm authorization to disengage the core lock.',
    instructions = 'Coordinate with Player 1. Confirm that both Core Key Alpha and Core Key Beta are engaged. Submit CORE ACCESS GRANTED.',
    puzzle_context = 'LEVEL 6 / STAGE 1: DUAL KEY',
    expected_answer_hash = 'CORE ACCESS GRANTED',
    answer_type = 'TEXT',
    technical_category = 'PROTOCOL-RECONSTRUCTION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=dual-key',
    puzzle_metadata = '{"interaction":"dual-key","discovery":"CORE ACCESS GRANTED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- LEVEL 6 STAGE 2: CORE RECONSTRUCTION
UPDATE questions SET
    evidence = 'DEPENDENCY PROTOCOL (ODD EDGES):
1. Level 1 Trace (K-17) -> establishes Level 3 Route (A-B-C)
3. Level 3 Packet (03) -> confirms Level 2 Transform (HEX-TO-TEXT)
5. Level 4 Cipher (SHIFT-3) -> exposes Level 5 Evidence Chain (F-12/R-4/N-9)',
    instructions = 'Combine your odd dependency edges with Player 2 even dependency edges to reconstruct the complete 6-stage master sequence. Submit CORE SEQUENCE VERIFIED.',
    puzzle_context = 'LEVEL 6 / STAGE 2: CORE RECONSTRUCTION',
    expected_answer_hash = 'CORE SEQUENCE VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'PROTOCOL-RECONSTRUCTION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=sequence-reconstruction',
    puzzle_metadata = '{"interaction":"sequence-reconstruction","items":["1. System Trace (L1)","2. Network Route (L3)","3. Packet Recovery (L3)","4. Data Transform (L2)","5. Cipher Decrypt (L4)","6. Pattern Forensics (L5)"],"discovery":"CORE SEQUENCE VERIFIED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'DEPENDENCY PROTOCOL (EVEN EDGES):
2. Level 3 Route (A-B-C) -> selects Level 3 Packet (03)
4. Level 2 Transform (HEX-TO-TEXT) -> verifies Level 4 Cipher (SHIFT-3)
6. Level 5 Evidence Chain -> extracts Level 5 Pattern (Fragment 05)

MASTER 6-STEP PROTOCOL SEQUENCE:
Step 1: System Trace (Level 1)
Step 2: Network Route (Level 3)
Step 3: Packet Recovery (Level 3)
Step 4: Data Transformation (Level 2)
Step 5: Cipher Decryption (Level 4)
Step 6: Pattern Forensics (Level 5)',
    instructions = 'Synthesize all six ordered dependencies with Player 1. Validate the unified sequence and submit CORE SEQUENCE VERIFIED.',
    puzzle_context = 'LEVEL 6 / STAGE 2: CORE RECONSTRUCTION',
    expected_answer_hash = 'CORE SEQUENCE VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'PROTOCOL-RECONSTRUCTION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=sequence-reconstruction',
    puzzle_metadata = '{"interaction":"sequence-reconstruction","items":["1. System Trace (L1)","2. Network Route (L3)","3. Packet Recovery (L3)","4. Data Transform (L2)","5. Cipher Decrypt (L4)","6. Pattern Forensics (L5)"],"discovery":"CORE SEQUENCE VERIFIED"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- LEVEL 6 STAGE 3: FINAL PROTOCOL & 6-DIGIT PASSKEY
UPDATE questions SET
    evidence = 'FINAL PROTOCOL CONSOLE - PRIMARY DERIVATION (ODD POSITIONS):
You are responsible for deriving POSITIONS 1, 3, and 5 of the 6-digit access code:

- POSITION 1 (from Level 1 Trace ''K-17''):
  Sum the digits of the trace number: 1 + 7 = 8.
  --> DIGIT 1 = 8

- POSITION 3 (from Level 3 Network Incident):
  Look at the suspicious data burst timestamp ending (10:02:09 dropped / packet 9).
  --> DIGIT 3 = 9

- POSITION 5 (from Level 5 Pattern Extraction):
  Count how many odd decoy positions were valid: 0.
  --> DIGIT 5 = 0

Your partial passkey mask: 8 _ 9 _ 0 _',
    instructions = 'Calculate your three assigned digits (Positions 1, 3, 5). Your teammate holds the derivation for Positions 2, 4, and 6. Combine all 6 digits in order to form the final 6-digit access passkey. Submit the passkey to breach the system.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL PROTOCOL',
    expected_answer_hash = '849201',
    answer_type = 'NUMERIC',
    technical_category = 'FINAL-PROTOCOL',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=final-protocol',
    puzzle_metadata = '{"interaction":"final-protocol","discovery":"849201"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_1';

UPDATE questions SET
    evidence = 'FINAL PROTOCOL CONSOLE - SECONDARY DERIVATION (EVEN POSITIONS):
You are responsible for deriving POSITIONS 2, 4, and 6 of the 6-digit access code:

- POSITION 2 (from Level 2 Data Vault):
  Length of the first decoded ASCII word prefix ''RECO'': 4 characters.
  --> DIGIT 2 = 4

- POSITION 4 (from Level 4 Decrypted Plaintext):
  Word count in the decrypted phrase ''HELLO WORLD'': 2 words.
  --> DIGIT 4 = 2

- POSITION 6 (from Level 6 Core Protocol):
  The single master unified protocol index: 1.
  --> DIGIT 6 = 1

Your partial passkey mask: _ 4 _ 2 _ 1',
    instructions = 'Calculate your three assigned digits (Positions 2, 4, 6). Player 1 holds the derivation for Positions 1, 3, and 5. Interleave all 6 digits (Pos 1 to 6) to derive the master 6-digit access passkey: [849201]. Enter the access code to authorize final escape.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL PROTOCOL',
    expected_answer_hash = '849201',
    answer_type = 'NUMERIC',
    technical_category = 'FINAL-PROTOCOL',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=final-protocol',
    puzzle_metadata = '{"interaction":"final-protocol","discovery":"849201"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_2';
