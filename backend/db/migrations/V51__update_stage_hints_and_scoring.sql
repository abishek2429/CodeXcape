-- =========================================================================
-- V51: Authoritative 15 Stage-Specific Hints & Scoring Integrity
-- =========================================================================

-- 1. Clean existing hints and hint usage to guarantee exactly 15 independent stage hints
DELETE FROM hint_usage;
DELETE FROM hints WHERE level_id IN (SELECT id FROM levels WHERE level_number BETWEEN 1 AND 6);

-- 2. Insert exactly 1 hint per stage for all 15 stages

-- Level 1: 2 stages
-- Level 1 Stage 1: Corrupted Execution Trace
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Trace the execution iteratively step-by-step from i=1 to 6. In each iteration, compute x using the divisibility condition first before checking whether x is even or odd to update y for that step.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 1;

-- Level 1 Stage 2: Python Trace Reconstruction
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Track how slice operations create new lists while direct index assignment mutates the original data list. Focus on calculating a[1] after the reversed loop subtraction to determine what gets placed into data[2].', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 1;

-- Level 2: 2 stages
-- Level 2 Stage 1: Stack + Queue Transmission
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Maintain two separate state logs for Stack S (Last-In-First-Out) and Queue Q (First-In-First-Out). Pay close attention when an element removed from the front of Q is pushed back onto S before the final pop.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 2;

-- Level 2 Stage 2: Binary Search Interrogation
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Follow the sequence of recorded midpoint values as the binary search search space narrows. The final inspected midpoint in the traversal sequence identifies the target element.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 2;

-- Level 3: 2 stages
-- Level 3 Stage 1: Packet Path Reconstruction
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Chain the gateway hops sequentially from the source subnet to the destination host, and deduce the transport protocol based on the strict guaranteed delivery requirement rather than port number alone.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 3;

-- Level 3 Stage 2: Subnet Forensics
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Calculate the total block size from the /27 prefix (32 addresses). Identify the network address and broadcast boundary to determine the exact first and last usable host IP range.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 3;

-- Level 4: 3 stages
-- Level 4 Stage 1: SQL Evidence Merge
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Filter records by department before grouping by student, and compute the aggregated average mark using a HAVING clause condition to find students whose average exceeds the threshold.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 2: Web Request Autopsy
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Since the client request syntax and authentication are completely valid, focus on the standard HTTP status category designated for unexpected, unhandled exceptions occurring inside server-side components.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 3: Git Branch Collision
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'When two branches modify the identical line of code from a common base commit, standard Git protocol requires manually resolving conflict markers and staging changes before committing the merge.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 4;

-- Level 5: 3 stages
-- Level 5 Stage 1: Multi-Layer Encoding Forensics
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Apply multi-stage decoding in sequence: first interpret the paired hexadecimal values as ASCII character codes, then recognize the resulting padded string format for the second decoding pass.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 2: Security Incident Correlation
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Distinguish between verifying who a user is versus determining what resources that verified user is permitted to access. Look at which security control restricts privilege levels.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 3: Cipher Chain
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'First convert each decimal value directly into its corresponding uppercase ASCII character, then reverse the Caesar shift by shifting each letter backward by the cipher key value.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 5;

-- Level 6: 3 stages
-- Level 6 Stage 1: Java Polymorphism Trace
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'In Java, instance method calls resolve dynamically based on the actual runtime object instantiated with ''new'', while inherited methods from superclasses remain accessible if not overridden.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 2: Docker Deployment Failure
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Docker port publishing syntax follows the format of mapping the host machine''s external port to the container''s internal listening port (-p HOST:CONTAINER).', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 3: NODE ZERO: Final Distributed Logic Breach
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'Construct a 4x4 deduction grid across Engineers, Languages, Days, and Responsibilities. Anchor the fixed pairs (Asha on Tuesday with Python; Monday with SQL Database) first to isolate who operates on Thursday.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
FROM levels l WHERE l.level_number = 6;

-- 3. Reset all anti-cheat score penalties on teams and recompute authoritative final score
UPDATE teams SET anti_cheat_penalty = 0;
UPDATE teams SET final_score = GREATEST(0, base_score - hint_penalty - wrong_attempt_penalty);
