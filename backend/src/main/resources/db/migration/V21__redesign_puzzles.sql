-- V21__redesign_puzzles.sql
-- Transform questions to technical puzzles

-- 1. Modify the questions table structure
ALTER TABLE questions RENAME COLUMN question_content TO evidence;
ALTER TABLE questions ADD COLUMN instructions TEXT;
ALTER TABLE questions ADD COLUMN technical_category VARCHAR(100);
ALTER TABLE questions ADD COLUMN difficulty VARCHAR(50);
ALTER TABLE questions ADD COLUMN validation_rules TEXT;
ALTER TABLE questions ADD COLUMN puzzle_metadata TEXT;

-- 2. Delete all existing puzzle content (we will overwrite with the 12 new puzzles)
DELETE FROM questions;

-- 3. Insert the 6 levels of interdependent technical puzzles

-- ============================================================
-- LEVEL 1: Observation + Logic
-- P1 has system logs. P2 has node mappings.
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(1, 1, 'PLAYER_1', 
'SYSTEM LOG:
[03:17:42] NODE-ALPHA initialized. Status: STABLE.
[03:19:18] NODE-DELTA crashed. Attempting reboot...
[03:21:06] NODE-BRAVO disconnected from primary array.
[03:24:12] NODE-CHARLIE synchronized.
[03:29:55] NODE-ECHO manual override engaged.',
'Analyze the system logs. Identify the exact chronological order of node interactions. Share the sequence of nodes with your teammate to determine the corresponding hardware sequence.', 
'Log Analysis', '94271', 'NUMERIC', true, 'System Analysis', 'HARD'),

(2, 1, 'PLAYER_2',
'HARDWARE MAPPING:
NODE-ALPHA  -> PORT 9
NODE-BRAVO  -> PORT 2
NODE-CHARLIE-> PORT 7
NODE-DELTA  -> PORT 4
NODE-ECHO   -> PORT 1',
'You have the hardware port mappings. Your teammate will provide a chronological sequence of node events. Map their sequence to the corresponding hardware ports to generate a 5-digit sequence.',
'Log Analysis', '94271', 'NUMERIC', true, 'System Analysis', 'HARD');

-- ============================================================
-- LEVEL 2: Encoding + Data Analysis
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(3, 2, 'PLAYER_1',
'ENCODED TRANSMISSION (BASE64):
NEQzMDUx',
'Decode the transmission. The result is a hex string. Share it with your teammate. They possess the decryption sequence required to uncover the final passcode.',
'Data Decoding', 'SYSTEM_UP', 'TEXT', true, 'Encoding', 'VERY_HARD'),

(4, 2, 'PLAYER_2',
'DECRYPTION SEQUENCE (XOR):
Hex Key: 17 0A 20 14 1C 0A
Character mapping: ASCII',
'Your teammate has an encoded hex string. Apply this XOR sequence byte-by-byte to their decoded hex string, then convert the resulting hex values into ASCII characters to find the final string.',
'Data Decoding', 'SYSTEM_UP', 'TEXT', true, 'Encoding', 'VERY_HARD');

-- ============================================================
-- LEVEL 3: Network / System Forensics
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(5, 3, 'PLAYER_1',
'ROUTING TABLE FRAGMENT:
Subnet 192.168.10.0/24 -> Gateway A (AS 65001)
Subnet 192.168.20.0/24 -> Gateway B (AS 65002)
Subnet 10.10.0.0/16    -> Gateway C (AS 65003)',
'Your teammate is tracking an anomalous packet. Ask them for the packet''s destination IP. Determine which Gateway it will route through, and share the AS (Autonomous System) number with them.',
'Network Forensics', '410', 'NUMERIC', true, 'Networking', 'VERY_HARD+'),

(6, 3, 'PLAYER_2',
'PACKET TRACE LOG:
Source: 172.16.5.5
Destination: 192.168.20.155
TTL: 64
Payload size: 410 bytes',
'Identify the destination IP of the anomalous packet and share it with your teammate to determine its Autonomous System (AS) number. 
If the AS number is even, the answer is the Payload size. If the AS number is odd, the answer is the TTL.',
'Network Forensics', '410', 'NUMERIC', true, 'Networking', 'VERY_HARD+');

-- ============================================================
-- LEVEL 4: Cryptographic Reasoning
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(7, 4, 'PLAYER_1',
'CIPHERTEXT: 
Z Y X W V',
'You have intercepted a secure ciphertext. Your teammate has the substitution matrix required to decode it. Share the ciphertext with them to determine the decrypted word.',
'Cryptography', 'APPLE', 'TEXT', true, 'Crypto', 'EXTREME'),

(8, 4, 'PLAYER_2',
'SUBSTITUTION MATRIX:
A=Z, B=Y, C=X, D=W, E=V, F=U, G=T, H=S, I=R, J=Q,
K=P, L=O, M=N, N=M, O=L, P=K, Q=J, R=I, S=H, T=G,
U=F, V=E, W=D, X=C, Y=B, Z=A',
'Your teammate has a ciphertext. Use this Atbash substitution matrix to decode their ciphertext. Enter the decoded word as your final answer.',
'Cryptography', 'APPLE', 'TEXT', true, 'Crypto', 'EXTREME');

-- ============================================================
-- LEVEL 5: Multi-Stage System Forensics
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(9, 5, 'PLAYER_1',
'FILE METADATA DUMP:
File: config.sys
Size: 1024 bytes
Last Modified: 1698750000 (Unix Epoch)
Permissions: 0755',
'You have the metadata for a critical file. Your teammate has a log showing file access. Compare the Last Modified timestamp with their access logs. Find the ID of the user who accessed it immediately AFTER it was modified.',
'System Forensics', 'U881', 'TEXT', true, 'Forensics', 'EXTREME+'),

(10, 5, 'PLAYER_2',
'ACCESS LOGS (Unix Epoch):
1698745000 - User U442 read config.sys
1698748000 - User U109 read config.sys
1698752000 - User U881 read config.sys
1698755000 - User U992 read config.sys',
'Your teammate has the exact timestamp when config.sys was last modified. Use their timestamp to identify the user who read the file immediately AFTER the modification occurred.',
'System Forensics', 'U881', 'TEXT', true, 'Forensics', 'EXTREME+');

-- ============================================================
-- LEVEL 6: Final System
-- ============================================================
INSERT INTO questions (id, level_id, player_number, evidence, instructions, puzzle_context, expected_answer_hash, answer_type, is_active, technical_category, difficulty)
VALUES 
(11, 6, 'PLAYER_1',
'SECURITY PROTOCOL FRAGMENT ALPHA:
Node A must authorize before Node C.
Node B requires Port 80 to be open.
Final checksum is calculated by multiplying the active port of Node B by the sequence number of Node C (1, 2, or 3).',
'Combine your protocol fragment with your teammate''s fragment to determine the correct sequence of nodes and the required open port. Calculate and submit the final checksum.',
'Final Architecture', '240', 'NUMERIC', true, 'Architecture', 'FINAL'),

(12, 6, 'PLAYER_2',
'SECURITY PROTOCOL FRAGMENT BETA:
Node B is the very first node to authorize.
The active port for Node B is determined by the total number of nodes (3) multiplied by 26 plus 2.
Node C is the last node to authorize.',
'Combine your protocol fragment with your teammate''s fragment to determine the active port and the exact authorization sequence. Calculate and submit the final checksum.',
'Final Architecture', '240', 'NUMERIC', true, 'Architecture', 'FINAL');


-- Update Hints to match new puzzles indirectly
UPDATE hints SET hint_content = 'The first digit of the final passkey is the number of nodes that crashed in Level 1.' WHERE level_id = 1;
UPDATE hints SET hint_content = 'The second digit of the final passkey is the length of the decrypted word in Level 2 minus 1.' WHERE level_id = 2;
UPDATE hints SET hint_content = 'The third digit of the final passkey is the first digit of the autonomous system (AS) number from Level 3.' WHERE level_id = 3;
UPDATE hints SET hint_content = 'The fourth digit of the final passkey corresponds to the alphabetical position of the first letter in the Level 4 answer (A=1, B=2), minus 1.' WHERE level_id = 4;
UPDATE hints SET hint_content = 'The fifth digit of the final passkey is the last digit of the User ID from Level 5.' WHERE level_id = 5;
UPDATE hints SET hint_content = 'The sixth digit of the final passkey is the final checksum from Level 6 divided by 80.' WHERE level_id = 6;
