ALTER TABLE questions ADD COLUMN puzzle_context VARCHAR(255);

UPDATE questions SET puzzle_context = 'Authentication & Shell Protocol' WHERE level_id = 1;
UPDATE questions SET puzzle_context = 'Signal & Telemetry Decryption' WHERE level_id = 2;
UPDATE questions SET puzzle_context = 'Memory Dump Forensics' WHERE level_id = 3;
UPDATE questions SET puzzle_context = 'Network Hijack & Handshake' WHERE level_id = 4;
UPDATE questions SET puzzle_context = 'Asymmetric Cryptographic Matrix' WHERE level_id = 5;
UPDATE questions SET puzzle_context = 'Core Overdrive Safety Override' WHERE level_id = 6;
