-- 1. Development Event
INSERT INTO events (id, name, description, status, passkey_hash)
VALUES (
    1, 
    'College Technical Fest Escape Room 2026', 
    'Annual Inter-College Two-Player Technical Escape Room Competition', 
    'READY', 
    '$2a$10$7vB9f1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m'
);

-- 2. Development Team
INSERT INTO teams (id, event_id, team_code, team_name, status)
VALUES (
    1, 
    1, 
    'TEAM-001', 
    'CyberKnights', 
    'REGISTERED'
);

-- 3. Development Players
INSERT INTO players (id, team_id, player_number, display_name, status)
VALUES 
(1, 1, 1, 'Player One (Operator)', 'INACTIVE'),
(2, 1, 2, 'Player Two (Analyzer)', 'INACTIVE');

-- 4. Six Game Levels
INSERT INTO levels (id, level_number, name, description, difficulty, is_active)
VALUES 
(1, 1, 'Level 1: System Breaker', 'Crack the initial authentication module.', 'EASY', true),
(2, 2, 'Level 2: Signal Decryption', 'Decode inter-node telemetry signals.', 'EASY', true),
(3, 3, 'Level 3: Memory Dump Analysis', 'Extract forensic clues from process memory dumps.', 'MEDIUM', true),
(4, 4, 'Level 4: Network Hijack', 'Trace BGP routing loops and protocol headers.', 'MEDIUM', true),
(5, 5, 'Level 5: Cryptographic Cipher', 'Solve asymmetric cipher matrix challenges.', 'HARD', true),
(6, 6, 'Level 6: Core Overdrive', 'Disable final reactor safety protocol locks.', 'HARD', true);

-- 5. Questions
INSERT INTO questions (id, level_id, player_number, question_content, expected_answer_hash, answer_type, is_active)
VALUES 
(1, 1, 'PLAYER_1', 'Find the open SSH port integer on node 192.168.1.10.', '22', 'NUMERIC', true),
(2, 1, 'PLAYER_2', 'Convert hexadecimal string 0x4142 to ASCII characters.', 'AB', 'TEXT', true),
(3, 2, 'PLAYER_1', 'Compute XOR checksum of byte stream [0x10, 0x20, 0x30].', '0', 'NUMERIC', true),
(4, 2, 'PLAYER_2', 'Identify the HTTP status code for Unauthorized access.', '401', 'NUMERIC', true),
(5, 3, 'PLAYER_1', 'Extract variable name stored at memory address 0x7FFF004.', 'SECRET_KEY', 'TEXT', true),
(6, 3, 'PLAYER_2', 'Calculate SHA-256 hash length in bits.', '256', 'NUMERIC', true),
(7, 4, 'PLAYER_1', 'Determine default subnet mask for Class C IPv4 address.', '255.255.255.0', 'TEXT', true),
(8, 4, 'PLAYER_2', 'Identify TCP flag set during initial connection handshake.', 'SYN', 'TEXT', true),
(9, 5, 'PLAYER_1', 'Decipher ROT13 encrypted string "EBG13".', 'ROT13', 'TEXT', true),
(10, 5, 'PLAYER_2', 'Compute prime factor of number 91 greater than 10.', '13', 'NUMERIC', true),
(11, 6, 'PLAYER_1', 'Identify the POSIX signal number for SIGKILL.', '9', 'NUMERIC', true),
(12, 6, 'PLAYER_2', 'Enter the final safety override keyword.', 'OVERRIDE_ALPHA', 'TEXT', true);

-- 6. Hints
INSERT INTO hints (id, level_id, hint_content, display_order, is_active)
VALUES 
(1, 1, 'First digit of final passkey is the square root of 64.', 1, true),
(2, 2, 'Second digit is the number of OSI layer model layers minus 3.', 2, true),
(3, 3, 'Third digit is the first prime number after 8.', 4, true),
(4, 4, 'Fourth digit is the binary representation of 0010 converted to decimal.', 2, true),
(5, 5, 'Fifth digit is the number of bits in a single byte minus 8.', 0, true),
(6, 6, 'Sixth digit is the value of 10 mod 9.', 1, true);

-- 7. Initial Team Level Progress for TEAM-001
INSERT INTO team_level_progress (team_id, level_id, player1_completed, player2_completed, level_status)
VALUES 
(1, 1, false, false, 'AVAILABLE'),
(1, 2, false, false, 'LOCKED'),
(1, 3, false, false, 'LOCKED'),
(1, 4, false, false, 'LOCKED'),
(1, 5, false, false, 'LOCKED'),
(1, 6, false, false, 'LOCKED');

-- Reset sequences for H2 auto increment
ALTER TABLE events ALTER COLUMN id RESTART WITH 100;
ALTER TABLE teams ALTER COLUMN id RESTART WITH 100;
ALTER TABLE players ALTER COLUMN id RESTART WITH 100;
ALTER TABLE levels ALTER COLUMN id RESTART WITH 100;
ALTER TABLE questions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE hints ALTER COLUMN id RESTART WITH 100;
