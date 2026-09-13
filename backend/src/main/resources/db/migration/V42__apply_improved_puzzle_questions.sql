-- V42: Apply improved puzzle questions, clearer asymmetric telemetry, and explicit formatting guidance from CODEXCAPE_IMPROVED_PUZZLES.md

-- =========================================================================
-- LEVEL 1: SYSTEM RECONSTRUCTION
-- =========================================================================

-- Level 1 Stage 1: Log Collision (Player 1)
UPDATE questions SET
    evidence = 'INCIDENT WINDOW: 08:13:58 to 08:14:27 (29 seconds)
Three log streams captured during the incident:

LOG STREAM A (HIGH-PRIORITY LOGS):
08:14:02  process=relay   pid=17  status=READY    channel=K
08:14:11  process=watcher pid=04  status=REJECTED channel=K
08:14:19  process=relay   pid=17  status=RETRY    channel=K  [NOTE: Same process (relay) at different times!]
08:14:27  process=archive pid=88  status=READ     channel=R

LOG STREAM B (SECONDARY LOGS):
08:13:58  process=archive pid=88  status=READ     channel=R
08:14:11  process=watcher pid=04  status=REJECTED channel=K

OUTSIDE THE INCIDENT WINDOW (Ignore these):
09:02:44  process=backup  pid=99  status=COMPLETE channel=R  [Backup runs at 9:02 AM - different time!]

CLUE FOR PLAYER 1:
Find the ONE process that changed state twice during the incident window (08:13:58–08:14:27).
Record its channel assignment AND the unique identifier (PID) for that process.
Answer format hint: SYSTEM TRACE: [CHANNEL]-[PID]',
    instructions = 'Sort the incident logs by timestamp. Find the single process that changed state twice during the incident window (08:13:58–08:14:27). Share the process name and PID with Player 2 to derive the trace label. Format: SYSTEM TRACE: [CHANNEL]-[PID]',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOG COLLISION',
    expected_answer_hash = 'SYSTEM TRACE: K-17',
    answer_type = 'TEXT',
    technical_category = 'SEQUENCING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline',
    puzzle_metadata = '{"interaction":"timeline","decoys":["backup"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 1 Stage 1: Log Collision (Player 2)
UPDATE questions SET
    evidence = 'SYSTEM ARCHITECTURE MAP
Process to Communication Channel Mappings:

- relay (pid=17):   owns channel K (active transaction pipeline — handles real-time data)
- watcher (pid=04): monitors channel K (observer-only, does NOT own channel K)
- archive (pid=88): owns channel R (storage volume — handles stored data)

VERIFICATION RULES:
1. Only ONE process can "own" a channel.
2. The watcher process only observes; it does not own anything.
3. When a process is marked REJECTED, it still belongs to its assigned channel.
4. When a process is marked RETRY, it indicates abnormal behavior.

DECOY:
- backup (pid=99): attached to channel R (routine snapshot outside window)',
    instructions = 'Player 1 will find ONE process that changed state twice during the incident. Use the architecture map to confirm which CHANNEL that process owns, verify the PID, and submit the shared discovery: SYSTEM TRACE: [CHANNEL]-[PID]',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOG COLLISION',
    expected_answer_hash = 'SYSTEM TRACE: K-17',
    answer_type = 'TEXT',
    technical_category = 'CORRELATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=timeline',
    puzzle_metadata = '{"interaction":"component-map","decoys":["backup"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 1 Stage 2: Access Panel (Player 1)
UPDATE questions SET
    evidence = 'ACCESS PANEL INTERFACE
Three physical selector knobs on the control console:

KNOB 1: NODE SELECTOR
Available options: [N-2] [N-4] [N-7]

KNOB 2: PROCESS SELECTOR
Available options: [relay] [watcher] [archive]

KNOB 3: SEQUENCE SELECTOR
Available options: [K-17] [R-03] [M-22]

ACTIVATION CRITERIA:
The panel requires:
1. The node infrastructure that hosts the abnormal channel.
2. The process responsible for the incident (from Stage 1).
3. The verified system trace code (from Stage 1).',
    instructions = 'Configure the access panel controls: select the anomalous process and the Stage 1 trace code. Ask Player 2 for the matching node ID that hosts that channel. When all three controls align, submit RECOVERY FRAGMENT 01.',
    puzzle_context = 'LEVEL 1 / STAGE 2: ACCESS PANEL',
    expected_answer_hash = 'RECOVERY FRAGMENT 01',
    answer_type = 'TEXT',
    technical_category = 'SYSTEMS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=access-panel',
    puzzle_metadata = '{"interaction":"access-panel","nodes":["N-2","N-4","N-7"],"processes":["relay","watcher","archive"],"sequences":["K-17","R-03","M-22"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 1 Stage 2: Access Panel (Player 2)
UPDATE questions SET
    evidence = 'NODE INFRASTRUCTURE MAP
Shows which communication channels run on which physical nodes:

INFRASTRUCTURE LAYOUT:
- NODE N-2: hosts channel M
- NODE N-4: hosts channel K (Current Focus)
- NODE N-7: hosts channel R

VERIFICATION MATRIX:
To unlock the access panel, the system requires:
1. The NODE that hosts the channel from Stage 1
2. The PROCESS that exhibited abnormal behavior (Stage 1)
3. The SYSTEM TRACE code (already solved in Stage 1)',
    instructions = 'Find which node hosts the channel owned by the anomalous process (Channel K). Confirm Node N-4 with Player 1 and submit the first recovery fragment: RECOVERY FRAGMENT 01.',
    puzzle_context = 'LEVEL 1 / STAGE 2: ACCESS PANEL',
    expected_answer_hash = 'RECOVERY FRAGMENT 01',
    answer_type = 'TEXT',
    technical_category = 'SYSTEMS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=access-panel',
    puzzle_metadata = '{"interaction":"access-panel","nodes":["N-2","N-4","N-7"],"processes":["relay","watcher","archive"],"sequences":["K-17","R-03","M-22"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- =========================================================================
-- LEVEL 2: DATA VAULT
-- =========================================================================

-- Level 2 Stage 1: Fragment Vault (Player 1)
UPDATE questions SET
    evidence = 'DATA RECOVERY: FRAGMENT INSPECTION
Available hex-encoded fragments with boundary markers:

Fragment B7:
  Boundary marker at END: 2F
  Status: Linked to another fragment

Fragment 41:
  Boundary marker at START: 7B
  Status: Linked to another fragment

Fragment C3:
  Boundary marker at END: 2F
  Status: Part of a chain

Fragment 99 (SUSPICIOUS / DECOY):
  Boundary marker checksum: INVALID
  Status: Corrupted / Decoy (Do not use!)

CLUES:
- Match boundary markers (2F, 7B) to link fragments.
- Fragment 99 is corrupted.
- Valid fragments are hexadecimal byte pairs representing raw computer bytes.',
    instructions = 'Match fragment boundary markers with Player 2 to link legitimate fragments and discard decoy [99]. Identify the representation used by the 2-character hex pairs and submit the transformation discovery: HEX-TO-TEXT.',
    puzzle_context = 'LEVEL 2 / STAGE 1: FRAGMENT VAULT',
    expected_answer_hash = 'HEX-TO-TEXT',
    answer_type = 'TEXT',
    technical_category = 'DATA-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly',
    puzzle_metadata = '{"interaction":"fragment-assembly","items":["Fragment [B7]","Fragment [41]","Fragment [C3]"],"decoy":"99"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 2 Stage 1: Fragment Vault (Player 2)
UPDATE questions SET
    evidence = 'FRAGMENT CHAIN ANALYSIS
Validation rules for connecting data fragments:

BOUNDARY CHAIN VALIDATION:
The correct fragment order is: [C3] -> [B7] -> [41]
- C3 ends with boundary marker 2F (links forward)
- B7 starts and ends with boundary markers (links both ways)
- 41 starts with boundary marker 7B (links backward)
- The checksum validates ONLY after the complete chain [C3][B7][41]

DECOYS:
- Fragment D0: Orphan fragment (no boundary match) -> IGNORE
- Fragment 99: Checksum invalid -> IGNORE',
    instructions = 'Verify the boundary chain order [C3] -> [B7] -> [41] with Player 1. Confirm that the 2-character hexadecimal byte fragments map to raw computer bytes. Submit the shared discovery: HEX-TO-TEXT.',
    puzzle_context = 'LEVEL 2 / STAGE 1: FRAGMENT VAULT',
    expected_answer_hash = 'HEX-TO-TEXT',
    answer_type = 'TEXT',
    technical_category = 'DATA-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=fragment-assembly',
    puzzle_metadata = '{"interaction":"fragment-assembly","items":["Fragment [C3]","Fragment [B7]","Fragment [41]"],"decoy":"D0"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 2 Stage 2: Transformation Chamber (Player 1)
UPDATE questions SET
    evidence = 'TRANSFORMATION CHAMBER
Recovered Hex Byte Stream: 52 45 43 4F 56 45 52 59

AVAILABLE ENGINES:
- decimal-to-text
- hex-to-text (converts hex pairs directly to ASCII characters)
- reverse-bytes
- base64-decode

TASK FOR PLAYER 1:
1. Select the hex-to-text engine identified in Stage 1.
2. Convert the byte stream: 52 (''R''), 45 (''E''), 43 (''C''), 4F (''O''), 56 (''V''), 45 (''E''), 52 (''R''), 59 (''Y'').
3. The decoded text spells: RECOVERY.',
    instructions = 'Apply the hex-to-text transformation to the recovered bytes. Verify the resulting English word with Player 2 and submit the sequential recovery fragment: RECOVERY FRAGMENT 02.',
    puzzle_context = 'LEVEL 2 / STAGE 2: TRANSFORMATION CHAMBER',
    expected_answer_hash = 'RECOVERY FRAGMENT 02',
    answer_type = 'TEXT',
    technical_category = 'TRANSFORMATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=hex-to-text',
    puzzle_metadata = '{"interaction":"transformation","operations":["decimal-to-text","hex-to-text","reverse-bytes","base64-decode"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 2 Stage 2: Transformation Chamber (Player 2)
UPDATE questions SET
    evidence = 'BYTE INTERPRETATION MATRIX
Hexadecimal pairs map directly to readable ASCII characters:

52 -> ''R''
45 -> ''E''
43 -> ''C''
4F -> ''O''
56 -> ''V''
45 -> ''E''
52 -> ''R''
59 -> ''Y''
Plaintext result: RECOVERY (8 characters, single readable English word).',
    instructions = 'Confirm the decoded word RECOVERY with Player 1. Since this is the second level, submit the second recovery fragment: RECOVERY FRAGMENT 02.',
    puzzle_context = 'LEVEL 2 / STAGE 2: TRANSFORMATION CHAMBER',
    expected_answer_hash = 'RECOVERY FRAGMENT 02',
    answer_type = 'TEXT',
    technical_category = 'TRANSFORMATION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=hex-to-text',
    puzzle_metadata = '{"interaction":"transformation"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- =========================================================================
-- LEVEL 3: NETWORK INCIDENT
-- =========================================================================

-- Level 3 Stage 1: Network Reconstruction (Player 1)
UPDATE questions SET
    evidence = 'NETWORK INCIDENT: INGRESS ANALYSIS
Sequential traffic records:
Entry 1: Traffic from external_source to Node A (10:15:02)
Entry 2: Traffic from Node A to Node B (10:15:05)
Entry 3: Traffic from Node B to Node C (10:15:08)
Entry 4: Traffic from Node C to sink (10:15:11)

DECOY:
Entry 5: Traffic from external_source directly to Node C (out-of-sequence jump - ignore)

Identified sequence: Node A -> Node B -> Node C',
    instructions = 'Trace the ingress traffic sequence originating at Node A. Ignore the out-of-sequence decoy jump. Compare with Player 2 topology and submit the route label: ROUTE A-B-C.',
    puzzle_context = 'LEVEL 3 / STAGE 1: NETWORK RECONSTRUCTION',
    expected_answer_hash = 'ROUTE A-B-C',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=network-graph',
    puzzle_metadata = '{"interaction":"network-graph"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 3 Stage 1: Network Reconstruction (Player 2)
UPDATE questions SET
    evidence = 'NETWORK TOPOLOGY MAP
Physical connection topology:
- Node A connects to: [B, D, Z]
- Node B connects to: [A, C, E]
- Node C connects to: [B, F, sink]
- Node D connects to: [A, E]
- Node E connects to: [B, D, F]
- Node F connects to: [C, E]

ROUTE VALIDATION:
- Route A -> B -> C: A-B connected? YES. B-C connected? YES. (Mutually confirmed valid route)',
    instructions = 'Verify Player 1''s proposed ingress sequence against the topology map. Confirm that links A-B and B-C exist in the network. Submit ROUTE A-B-C.',
    puzzle_context = 'LEVEL 3 / STAGE 1: NETWORK RECONSTRUCTION',
    expected_answer_hash = 'ROUTE A-B-C',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-RECONSTRUCTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=network-graph',
    puzzle_metadata = '{"interaction":"network-graph"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 3 Stage 2: Trace The Connection (Player 1)
UPDATE questions SET
    evidence = 'PACKET FORENSICS: TRACE LOG
Checkpoints captured along the network route:
- 10:02:01 [A -> B] CONNECT (Normal ingress)
- 10:02:03 [B -> C] FORWARD (Normal relay)
- 10:02:04 [C -> E] FORWARD (Payload: 0x504B - Unexpected binary burst)
- 10:02:09 [A -> D] DROP (Decoy scanning noise)

The anomalous packet passed through Node C and egressed toward Node E.',
    instructions = 'Track communications along the reconstructed route. Identify the suspicious transmission hop with Player 2 and submit the isolated packet path discovery (e.g. PACKET PATH C-E).',
    puzzle_context = 'LEVEL 3 / STAGE 2: TRACE THE CONNECTION',
    expected_answer_hash = 'PACKET PATH C-E',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-FORENSICS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=trace-timeline',
    puzzle_metadata = '{"interaction":"trace-timeline"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 3 Stage 2: Trace The Connection (Player 2)
UPDATE questions SET
    evidence = 'TRAFFIC ANOMALY REPORT
- 10:02:03 [B -> C] FORWARD: legitimate protocol control
- 10:02:04 [C -> E] FORWARD: unexpected binary data burst detected (0x504B)
- 10:02:09 [A -> D] DROP: decoy scanning noise

The unauthorized data burst occurs on hop C -> E.',
    instructions = 'Compare timestamps and payload indicators with Player 1. Isolate the anomalous packet path and submit the packet path discovery (e.g. PACKET PATH C-E).',
    puzzle_context = 'LEVEL 3 / STAGE 2: TRACE THE CONNECTION',
    expected_answer_hash = 'PACKET PATH C-E',
    answer_type = 'TEXT',
    technical_category = 'NETWORK-FORENSICS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=trace-timeline',
    puzzle_metadata = '{"interaction":"trace-timeline"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 3 Stage 3: Packet Recovery (Player 1)
UPDATE questions SET
    evidence = 'PACKET REASSEMBLY: FRAGMENT CAPTURE
Corrupted packet segments recovered from path C-E:
- Segment H: Header bytes [50 4B] (''PK'')
- Segment P: Payload bytes [52 45 43 4F] (''RECO'')
- Segment C: Checksum bytes [56 45 52 59] (''VERY'')
- Decoy Segment X: Noise bytes [99 AA BB] (from dropped link A->D - ignore)

Standard packet structure: Header -> Payload -> Checksum',
    instructions = 'Order valid packet segments (Header, Payload, Checksum). Discard the decoy noise from dropped link A->D and submit RECOVERY FRAGMENT 03.',
    puzzle_context = 'LEVEL 3 / STAGE 3: PACKET RECOVERY',
    expected_answer_hash = 'RECOVERY FRAGMENT 03',
    answer_type = 'TEXT',
    technical_category = 'PACKET-RECOVERY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=packet-reassembly',
    puzzle_metadata = '{"interaction":"packet-reassembly","items":["Header [50 4B]","Payload [52 45 43 4F]","Checksum [56 45 52 59]"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 3 Stage 3: Packet Recovery (Player 2)
UPDATE questions SET
    evidence = 'PACKET STRUCTURE VERIFICATION
Packet Reassembly Protocol:
- Assembly sequence: Header -> Payload -> Checksum
- Total segments required: 3 valid segments
- Exclude dropped noise from decoy link A->D.
- Reassembled packet payload confirms the third recovery artifact.',
    instructions = 'Confirm the valid payload order (Header -> Payload -> Checksum) with Player 1. Submit RECOVERY FRAGMENT 03.',
    puzzle_context = 'LEVEL 3 / STAGE 3: PACKET RECOVERY',
    expected_answer_hash = 'RECOVERY FRAGMENT 03',
    answer_type = 'TEXT',
    technical_category = 'PACKET-RECOVERY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=packet-reassembly',
    puzzle_metadata = '{"interaction":"packet-reassembly","items":["Header [50 4B]","Payload [52 45 43 4F]","Checksum [56 45 52 59]"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- =========================================================================
-- LEVEL 4: ENCRYPTED ROOM
-- =========================================================================

-- Level 4 Stage 1: Cipher Discovery (Player 1)
UPDATE questions SET
    evidence = 'CRYPTANALYSIS: CIPHER TEXT ANALYSIS
Observed encrypted message: KHOOR ZRUOG

Observed character transformations:
''A'' -> ''D'' (+3)
''B'' -> ''E'' (+3)
''M'' -> ''P'' (+3)

OBSERVATIONS:
- Alphabetical distance is preserved across all transformed characters.
- Shifting each letter backward by 3 produces: HELLO WORLD.',
    instructions = 'Infer the transformation family and offset parameter. Compare with Player 2 and submit the shared discovery: SHIFT-3.',
    puzzle_context = 'LEVEL 4 / STAGE 1: CIPHER DISCOVERY',
    expected_answer_hash = 'SHIFT-3',
    answer_type = 'TEXT',
    technical_category = 'CIPHER-REASONING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=cipher-deduction',
    puzzle_metadata = '{"interaction":"cipher-deduction"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 4 Stage 1: Cipher Discovery (Player 2)
UPDATE questions SET
    evidence = 'CIPHER SPECIFICATION VALIDATION
Caesar Cipher Definition:
- Takes a plaintext message and shifts each letter by a fixed displacement.
- Reverse shift test: Shifting ''KHOOR ZRUOG'' backward by 3 positions yields ''HELLO WORLD''.
- Result is readable English plaintext.',
    instructions = 'Combine cipher properties with Player 1''s observed character offsets. Confirm the shift parameter is 3 and submit: SHIFT-3.',
    puzzle_context = 'LEVEL 4 / STAGE 1: CIPHER DISCOVERY',
    expected_answer_hash = 'SHIFT-3',
    answer_type = 'TEXT',
    technical_category = 'CIPHER-REASONING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=cipher-deduction',
    puzzle_metadata = '{"interaction":"cipher-deduction"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 4 Stage 2: Decryption Interface (Player 1)
UPDATE questions SET
    evidence = 'DECRYPTION INTERFACE
Encrypted Ciphertext Blocks:
Block 1: [KHOOR]
Block 2: [ZRUOG]

Candidate Transforms: shift-1, shift-3, reverse, substitution
Applying shift -3:
[KHOOR] -> ''HELLO''
[ZRUOG] -> ''WORLD''
Plaintext output: ''HELLO WORLD'' (2 words).',
    instructions = 'Select the shift-3 operation discovered in Stage 1. Decrypt the blocks in order, verify the readable English output with Player 2, and submit RECOVERY FRAGMENT 04.',
    puzzle_context = 'LEVEL 4 / STAGE 2: DECRYPTION INTERFACE',
    expected_answer_hash = 'RECOVERY FRAGMENT 04',
    answer_type = 'TEXT',
    technical_category = 'DECRYPTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=shift-3',
    puzzle_metadata = '{"interaction":"decryption","operations":["shift-1","shift-3","reverse","substitution"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 4 Stage 2: Decryption Interface (Player 2)
UPDATE questions SET
    evidence = 'RECOVERY FRAGMENT SYNTHESIS
Decrypted Plaintext: ''HELLO WORLD'' (2 words).

Fragment Sequence Context:
- Level 1 Stage 2: RECOVERY FRAGMENT 01
- Level 2 Stage 2: RECOVERY FRAGMENT 02
- Level 3 Stage 3: RECOVERY FRAGMENT 03
- Level 4 Stage 2: RECOVERY FRAGMENT 04
- Level 5 Stage 3: RECOVERY FRAGMENT 05',
    instructions = 'Confirm the two-word plaintext with Player 1. Since this is Level 4 Stage 2, submit the fourth recovery fragment: RECOVERY FRAGMENT 04.',
    puzzle_context = 'LEVEL 4 / STAGE 2: DECRYPTION INTERFACE',
    expected_answer_hash = 'RECOVERY FRAGMENT 04',
    answer_type = 'TEXT',
    technical_category = 'DECRYPTION',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT;OPERATION=shift-3',
    puzzle_metadata = '{"interaction":"decryption"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- =========================================================================
-- LEVEL 5: COLLAPSED SYSTEM
-- =========================================================================

-- Level 5 Stage 1: Evidence Board (Player 1)
UPDATE questions SET
    evidence = 'FORENSIC EVIDENCE: DOSSIER A
- File Record [F-12]: modified at 14:03:00 (Incident Trigger)
- Security Identifier [R-4]: generated at 14:04:00
- Network Broadcast [N-9]: initiated at 14:05:00 references ID [R-4]
- Decoy File [F-88]: routine backup at 12:00:00 (ignore)',
    instructions = 'Connect artifacts sharing identical incident time windows and security identifiers. Discard decoy backup [F-88]. Correlate with Player 2 to submit the chain: CHAIN F-12/R-4/N-9.',
    puzzle_context = 'LEVEL 5 / STAGE 1: EVIDENCE BOARD',
    expected_answer_hash = 'CHAIN F-12/R-4/N-9',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-board',
    puzzle_metadata = '{"interaction":"evidence-board","items":["File [F-12] (14:03)","Identifier [R-4] (14:04)","Network [N-9] (14:05)"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 5 Stage 1: Evidence Board (Player 2)
UPDATE questions SET
    evidence = 'INCIDENT CAUSALITY VERIFICATION: DOSSIER B
- Process [P-7]: spawned at 14:04:00, reads Identifier [R-4] from File [F-12]
- Network Socket [N-9]: opened at 14:05:00 by Process [P-7]
- Decoy Process [P-2]: references obsolete ID [R-8] (ignore)

Verified Causal Chain: File F-12 -> Report/Identifier R-4 -> Network Socket N-9',
    instructions = 'Correlate process and socket telemetry with Player 1. Confirm the valid incident causality chain and submit CHAIN F-12/R-4/N-9.',
    puzzle_context = 'LEVEL 5 / STAGE 1: EVIDENCE BOARD',
    expected_answer_hash = 'CHAIN F-12/R-4/N-9',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-board',
    puzzle_metadata = '{"interaction":"evidence-board","items":["File [F-12] (14:03)","Identifier [R-4] (14:04)","Network [N-9] (14:05)"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 5 Stage 2: Evidence Chain (Player 1)
UPDATE questions SET
    evidence = 'CHAIN TRACE: NODE P-7 ARTIFACTS
- Linked file points to transformation record [T-3].
- Record [T-3] contains a reference to RECOVERY FRAGMENT 02 recovered in Level 2.
- Decoy record [T-8]: invalid checksum (ignore).',
    instructions = 'Follow the incident chain from Stage 1 into the system archives using Level 2 discoveries. Discard decoy [T-8] and submit CHAIN VERIFIED.',
    puzzle_context = 'LEVEL 5 / STAGE 2: EVIDENCE CHAIN',
    expected_answer_hash = 'CHAIN VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-chain',
    puzzle_metadata = '{"interaction":"evidence-chain"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 5 Stage 2: Evidence Chain (Player 2)
UPDATE questions SET
    evidence = 'CHAIN CROSS-LEVEL VERIFICATION
- Record [T-3] is verified: its hash matches RECOVERY FRAGMENT 02 from Level 2.
- The forensic link between Level 2 and Node N-9 is established.',
    instructions = 'Confirm the cross-level evidence link with Player 1. Submit CHAIN VERIFIED.',
    puzzle_context = 'LEVEL 5 / STAGE 2: EVIDENCE CHAIN',
    expected_answer_hash = 'CHAIN VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FORENSICS',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=evidence-chain',
    puzzle_metadata = '{"interaction":"evidence-chain"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 5 Stage 3: Pattern Extraction (Player 1)
UPDATE questions SET
    evidence = 'RAW TELEMETRY STREAM (10 SYMBOLS):
Pos 1:  [X] (Decoy)
Pos 2:  [R] (Valid)
Pos 3:  [Q] (Decoy)
Pos 4:  [E] (Valid)
Pos 5:  [Z] (Decoy)
Pos 6:  [C] (Valid)
Pos 7:  [W] (Decoy)
Pos 8:  [0] (Valid)
Pos 9:  [M] (Decoy)
Pos 10: [5] (Decoy)

EXTRACTION RULE: Filter to only even index positions: [2, 4, 6, 8]. All odd positions are decoy noise.',
    instructions = 'Apply the even-position extraction rule [2, 4, 6, 8] to eliminate decoy noise. Share the filtered positions with Player 2 to submit RECOVERY FRAGMENT 05.',
    puzzle_context = 'LEVEL 5 / STAGE 3: PATTERN EXTRACTION',
    expected_answer_hash = 'RECOVERY FRAGMENT 05',
    answer_type = 'TEXT',
    technical_category = 'PATTERN-RECOGNITION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=pattern-extraction',
    puzzle_metadata = '{"interaction":"pattern-extraction","items":["Pos 2: R","Pos 4: E","Pos 6: C","Pos 8: 0"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 5 Stage 3: Pattern Extraction (Player 2)
UPDATE questions SET
    evidence = 'PATTERN INTERPRETATION KEY
- Extraction rule: Select even positions [2, 4, 6, 8] from the stream.
- Filtered stream yields valid characters: R, E, C, 0.
- Extracted symbols confirm the final forensic marker: RECOVERY FRAGMENT 05.
- Decoy noise: Odd positions [1, 3, 5, 7, 9, 10] contain misleading interference.',
    instructions = 'Verify the even-position extraction with Player 1. Submit the fifth recovery fragment: RECOVERY FRAGMENT 05.',
    puzzle_context = 'LEVEL 5 / STAGE 3: PATTERN EXTRACTION',
    expected_answer_hash = 'RECOVERY FRAGMENT 05',
    answer_type = 'TEXT',
    technical_category = 'PATTERN-RECOGNITION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=pattern-extraction',
    puzzle_metadata = '{"interaction":"pattern-extraction","items":["Pos 2: R","Pos 4: E","Pos 6: C","Pos 8: 0"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- =========================================================================
-- LEVEL 6: THE CORE
-- =========================================================================

-- Level 6 Stage 1: Dual Key (Player 1)
UPDATE questions SET
    evidence = 'CORE KEY COMPONENT ALPHA
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
    puzzle_metadata = '{"interaction":"dual-key"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 6 Stage 1: Dual Key (Player 2)
UPDATE questions SET
    evidence = 'CORE KEY COMPONENT BETA
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
    puzzle_metadata = '{"interaction":"dual-key"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 6 Stage 2: Core Reconstruction (Player 1)
UPDATE questions SET
    evidence = 'DEPENDENCY PROTOCOL (ODD EDGES):
1. Level 1 Trace (K-17)     -> establishes Level 3 Route (A-B-C)
3. Level 3 Packet (03)      -> confirms Level 2 Transform (HEX-TO-TEXT)
5. Level 4 Cipher (SHIFT-3) -> exposes Level 5 Evidence Chain (F-12/R-4/N-9)',
    instructions = 'Combine your odd dependency edges with Player 2''s even dependency edges to reconstruct the complete 6-stage master sequence. Submit CORE SEQUENCE VERIFIED.',
    puzzle_context = 'LEVEL 6 / STAGE 2: CORE RECONSTRUCTION',
    expected_answer_hash = 'CORE SEQUENCE VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'PROTOCOL-RECONSTRUCTION',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=sequence-reconstruction',
    puzzle_metadata = '{"interaction":"sequence-reconstruction","items":["1. System Trace (L1)","2. Network Route (L3)","3. Packet Recovery (L3)","4. Data Transform (L2)","5. Cipher Decrypt (L4)","6. Pattern Forensics (L5)"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 6 Stage 2: Core Reconstruction (Player 2)
UPDATE questions SET
    evidence = 'DEPENDENCY PROTOCOL (EVEN EDGES):
2. Level 3 Route (A-B-C)       -> selects Level 3 Packet (03)
4. Level 2 Transform (HEX-TO-TEXT) -> verifies Level 4 Cipher (SHIFT-3)
6. Level 5 Evidence Chain      -> extracts Level 5 Pattern (Fragment 05)

UNIFIED 6-STEP PROTOCOL SEQUENCE:
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
    puzzle_metadata = '{"interaction":"sequence-reconstruction","items":["1. System Trace (L1)","2. Network Route (L3)","3. Packet Recovery (L3)","4. Data Transform (L2)","5. Cipher Decrypt (L4)","6. Pattern Forensics (L5)"]}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 6 Stage 3: Final Protocol (Player 1)
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
    instructions = 'Calculate your three assigned digits (Positions 1, 3, 5). Player 2 holds the derivation for Positions 2, 4, and 6. Combine all 6 digits in alternating order (Pos 1 to 6) to derive the master 6-digit access passkey. Submit FINAL PROTOCOL VERIFIED to authorize passkey entry.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL PROTOCOL',
    expected_answer_hash = 'FINAL PROTOCOL VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FINAL-PROTOCOL',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=final-protocol',
    puzzle_metadata = '{"interaction":"final-protocol"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 6 Stage 3: Final Protocol (Player 2)
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
    instructions = 'Calculate your three assigned digits (Positions 2, 4, 6). Player 1 holds the derivation for Positions 1, 3, and 5. Interleave all 6 digits in alternating order (Pos 1 to 6) to derive the master 6-digit access passkey. Submit FINAL PROTOCOL VERIFIED to authorize passkey entry.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL PROTOCOL',
    expected_answer_hash = 'FINAL PROTOCOL VERIFIED',
    answer_type = 'TEXT',
    technical_category = 'FINAL-PROTOCOL',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT;MODE=final-protocol',
    puzzle_metadata = '{"interaction":"final-protocol"}'
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_2';
