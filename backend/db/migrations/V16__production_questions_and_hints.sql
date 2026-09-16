-- V16__production_questions_and_hints.sql
-- Production-quality interdependent questions for CodeXcape
-- 6 Levels × 2 Players = 12 Questions + 6 Hints

-- ============================================================
-- Update Level Metadata to match production difficulty
-- ============================================================
UPDATE levels SET name = 'Level 1: Algorithm Trace', description = 'Trace through algorithm execution and derive the result cooperatively.', difficulty = 'DIFFICULT' WHERE level_number = 1;
UPDATE levels SET name = 'Level 2: Network Protocol Analysis', description = 'Analyze packet structures and OS networking internals.', difficulty = 'MORE_DIFFICULT' WHERE level_number = 2;
UPDATE levels SET name = 'Level 3: Database Forensics', description = 'Reconstruct SQL query execution from schema and plan fragments.', difficulty = 'HARD' WHERE level_number = 3;
UPDATE levels SET name = 'Level 4: Cryptographic Decryption', description = 'Crack a multi-step cipher using distributed key fragments.', difficulty = 'VERY_HARD' WHERE level_number = 4;
UPDATE levels SET name = 'Level 5: Concurrency Deadlock', description = 'Analyze concurrent thread execution and resolve a deadlock.', difficulty = 'EXPERT' WHERE level_number = 5;
UPDATE levels SET name = 'Level 6: System Architecture', description = 'Final challenge combining distributed systems, hashing, and consensus.', difficulty = 'EXTREME' WHERE level_number = 6;

-- ============================================================
-- LEVEL 1: Algorithms / Programming (DIFFICULT)
-- Interdependency: P1 has a function and needs an input value that only P2 can compute.
--                  P2 has a different function and needs the output that only P1 can produce.
-- ============================================================
UPDATE questions SET
    question_content = 'You have the following Python function:\n\ndef transform(x, seed):\n    result = seed\n    for i in range(1, x + 1):\n        if i % 3 == 0:\n            result = result + i * 2\n        elif i % 2 == 0:\n            result = result - i\n        else:\n            result = result + i\n    return result % 100\n\nYour teammate has computed the value of ''seed''. Ask them for it.\nOnce you have the seed, compute transform(7, seed).\n\nEnter the final numeric result.',
    expected_answer_hash = '37',
    answer_type = 'NUMERIC',
    puzzle_context = 'Algorithm Trace'
WHERE id = 1;

UPDATE questions SET
    question_content = 'You have the following Python function:\n\ndef compute_seed(data):\n    total = 0\n    for ch in data:\n        total = total + ord(ch)\n    return total % 50\n\nThe input data string is: "ESCAPE"\nCompute the seed value and share it with your teammate — they need it.\n\nNow, your teammate will tell you their transform() result (call it T).\nCompute: (T * 3 + seed) % 100\n\nEnter the final numeric result.',
    expected_answer_hash = '29',
    answer_type = 'NUMERIC',
    puzzle_context = 'Algorithm Trace'
WHERE id = 2;

-- Verification for Level 1:
-- P2: compute_seed("ESCAPE") = (69+83+67+65+80+69) % 50 = 433 % 50 = 33. seed = 33.
-- P1: transform(7, 33):
--   i=1: 33+1=34, i=2: 34-2=32, i=3: 32+6=38, i=4: 38-4=34,
--   i=5: 34+5=39, i=6: 39+12=51, i=7: 51+7=58
--   58 % 100 = 58... Wait, let me recalculate.
--   Actually: i=1 (odd, not %3): 33+1=34
--   i=2 (even, not %3): 34-2=32
--   i=3 (%3): 32+3*2=38
--   i=4 (even): 38-4=34
--   i=5 (odd): 34+5=39
--   i=6 (%3): 39+6*2=51
--   i=7 (odd): 51+7=58
--   result = 58 % 100 = 58. Hmm, let me fix the answer.
-- P2 answer: (58 * 3 + 33) % 100 = (174 + 33) % 100 = 207 % 100 = 7
-- Let me fix both answers to be correct:

UPDATE questions SET expected_answer_hash = '58' WHERE id = 1;
UPDATE questions SET expected_answer_hash = '7' WHERE id = 2;

-- ============================================================
-- LEVEL 2: Networks / Operating Systems (MORE DIFFICULT)
-- Interdependency: P1 has a routing table and needs the gateway IP that P2 can derive.
--                  P2 has an ARP table and needs the destination subnet from P1.
-- ============================================================
UPDATE questions SET
    question_content = 'You are analyzing a router''s forwarding table:\n\n| Destination Network | Subnet Mask     | Next Hop      | Interface |\n|---------------------|-----------------|---------------|-----------|\n| 10.0.1.0            | 255.255.255.0   | 192.168.1.1   | eth0      |\n| 10.0.2.0            | 255.255.255.128 | 192.168.1.5   | eth1      |\n| 172.16.0.0          | 255.255.0.0     | 192.168.1.10  | eth2      |\n| 0.0.0.0             | 0.0.0.0         | 192.168.1.254 | eth0      |\n\nA packet arrives with destination IP: 10.0.2.100\n\nYour teammate will tell you the MAC address associated with the correct next-hop gateway.\nDetermine which next-hop gateway this packet will be forwarded to, and share that IP with your teammate.\n\nThen: How many usable host addresses exist in the destination subnet of the matching route?\n\nEnter the number of usable hosts.',
    expected_answer_hash = '126',
    answer_type = 'NUMERIC',
    puzzle_context = 'Network Routing'
WHERE id = 3;

UPDATE questions SET
    question_content = 'You have the following ARP cache from the same router:\n\n| IP Address    | MAC Address       | Interface |\n|---------------|-------------------|-----------|\n| 192.168.1.1   | AA:BB:CC:11:22:33 | eth0      |\n| 192.168.1.5   | AA:BB:CC:44:55:66 | eth1      |\n| 192.168.1.10  | AA:BB:CC:77:88:99 | eth2      |\n| 192.168.1.254 | AA:BB:CC:DD:EE:FF | eth0      |\n\nYour teammate will tell you the next-hop IP for their packet.\nLook up the MAC address for that IP and share it with them.\n\nNow answer: What is the hexadecimal sum of the last two octets of that MAC address?\n(For example, if last two octets are AA:BB, compute 0xAA + 0xBB and give the decimal result.)\n\nEnter the decimal result.',
    expected_answer_hash = '171',
    answer_type = 'NUMERIC',
    puzzle_context = 'Network ARP Resolution'
WHERE id = 4;

-- Verification for Level 2:
-- P1: 10.0.2.100 matches 10.0.2.0/25 (255.255.255.128). Next hop = 192.168.1.5.
--     Usable hosts in /25 = 128 - 2 = 126. Answer: 126. ✓
-- P2: Next hop 192.168.1.5 → MAC = AA:BB:CC:44:55:66.
--     Last two octets: 55 and 66 (hex). 0x55 = 85, 0x66 = 102. Sum = 187.
-- Hmm, let me recalculate: 0x55 = 5*16+5 = 85, 0x66 = 6*16+6 = 102. 85+102 = 187.
UPDATE questions SET expected_answer_hash = '187' WHERE id = 4;

-- ============================================================
-- LEVEL 3: Databases / SQL (HARD)
-- Interdependency: P1 has the schema, P2 has partial query results.
--                  They must combine to determine the correct SQL output.
-- ============================================================
UPDATE questions SET
    question_content = 'You have the following database schema:\n\nCREATE TABLE departments (\n  dept_id INT PRIMARY KEY,\n  dept_name VARCHAR(50)\n);\n\nCREATE TABLE employees (\n  emp_id INT PRIMARY KEY,\n  name VARCHAR(50),\n  dept_id INT REFERENCES departments(dept_id),\n  salary DECIMAL(10,2)\n);\n\nData in departments:\n| dept_id | dept_name   |\n|---------|-------------|\n| 1       | Engineering |\n| 2       | Marketing   |\n| 3       | Finance     |\n| 4       | HR          |\n\nData in employees:\n| emp_id | name    | dept_id | salary   |\n|--------|---------|---------|----------|\n| 101    | Alice   | 1       | 95000.00 |\n| 102    | Bob     | 1       | 87000.00 |\n| 103    | Charlie | 2       | 72000.00 |\n| 104    | Diana   | 3       | 91000.00 |\n| 105    | Eve     | 1       | 105000.00|\n| 106    | Frank   | 2       | 68000.00 |\n| 107    | Grace   | NULL    | 55000.00 |\n\nYour teammate has a query. They will ask you for the department name that has the highest average salary.\nTell them, and also tell them how many employees are in that department.\n\nYour answer: What is the total salary of ALL employees in the department with the highest average salary?\n\nEnter the numeric total (no decimal, no commas).',
    expected_answer_hash = '287000',
    answer_type = 'NUMERIC',
    puzzle_context = 'SQL Analysis'
WHERE id = 5;

UPDATE questions SET
    question_content = 'You are running a query on a database but can only see partial results.\n\nThe query is:\nSELECT d.dept_name, COUNT(e.emp_id) as emp_count, AVG(e.salary) as avg_salary\nFROM departments d\nLEFT JOIN employees e ON d.dept_id = e.dept_id\nGROUP BY d.dept_name\nORDER BY avg_salary DESC;\n\nPartial result you can see:\n| dept_name   | emp_count | avg_salary  |\n|-------------|-----------|-------------|\n| ???         | ???       | 95666.67    |\n| Finance     | 1         | 91000.00    |\n| Marketing   | 2         | 70000.00    |\n| HR          | 0         | NULL        |\n\nThe first row is hidden. Ask your teammate: which department has the highest average salary, and how many employees are in it?\n\nOnce you know: compute avg_salary × emp_count for that department (round to nearest integer).\nThen subtract the Finance department''s total salary (91000).\n\nEnter the final numeric result.',
    expected_answer_hash = '196000',
    answer_type = 'NUMERIC',
    puzzle_context = 'SQL Analysis'
WHERE id = 6;

-- Verification for Level 3:
-- Engineering has: Alice(95K) + Bob(87K) + Eve(105K) = 287K. Avg = 95666.67. Count = 3.
-- P1 answer: Total salary in Engineering = 287000. ✓
-- P2: avg_salary * emp_count = 95666.67 * 3 = 287000 (rounded). 287000 - 91000 = 196000. ✓

-- ============================================================
-- LEVEL 4: Cryptography / Security (VERY HARD)
-- Interdependency: P1 has the ciphertext and column order, P2 has the key length and transposition rule.
-- ============================================================
UPDATE questions SET
    question_content = 'You have intercepted a columnar transposition ciphertext:\n\nCiphertext: "ATECSRHKCIEP"\n\nThe key used for encryption has a specific length that your teammate knows.\nAsk them for the key length.\n\nThe columns were read in this order during encryption: the key word was sorted alphabetically,\nand columns were read in that sorted order.\n\nThe key word is: "HACK"\nSorted alphabetically: A=1, C=2, H=3, K=4\nSo column read order is: 1, 2, 3, 4 (columns corresponding to A, C, H, K)\n\nReconstruct the plaintext by:\n1. Key length = number your teammate gives you (should be 4)\n2. Number of rows = ceil(12 / 4) = 3\n3. Fill columns in sorted key order with the ciphertext\n4. Read row by row\n\nWhat is the decrypted plaintext? (Enter as a single word, no spaces)',
    expected_answer_hash = 'ATTACKHACKER',
    answer_type = 'TEXT',
    puzzle_context = 'Cryptanalysis'
WHERE id = 7;

-- Verification detail for P1:
-- Key = "HACK", sorted: A(col0)=1, C(col2)=2, H(col1)=3, K(col3)=4
-- Ciphertext = "ATECSRHKCIEP", key length = 4, rows = 3
-- Fill by sorted order: Col A(pos 0): A,T,E | Col C(pos 2): C,S,R | Col H(pos 1): H,K,C | Col K(pos 3): I,E,P
-- Wait, let me re-sort. HACK letters: H=pos0, A=pos1, C=pos2, K=pos3
-- Alphabetical: A(pos1)=rank1, C(pos2)=rank2, H(pos0)=rank3, K(pos3)=rank4
-- Columns read in order: pos1, pos2, pos0, pos3
-- Ciphertext split into 3-letter groups (3 rows): ATE, CSR, HKC, IEP
-- Col at pos1: A,T,E | Col at pos2: C,S,R | Col at pos0: H,K,C | Col at pos3: I,E,P
-- Read rows: row0: pos0=H, pos1=A, pos2=C, pos3=I → HACI
-- Hmm that doesn't spell right. Let me redesign this question more carefully.

-- Actually let me simplify the cipher approach for deterministic answer:
UPDATE questions SET
    question_content = 'You have intercepted an encoded message using a Caesar cipher with a shift value.\n\nEncoded message: "DWWDFN DW GDZQ"\n\nYour teammate knows the shift value. Ask them for it.\n\nApply the Caesar cipher decryption (shift backward by that value) to decode the message.\nSpaces remain as spaces.\n\nWhat is the decoded plaintext? (Enter exact text including spaces, all uppercase)',
    expected_answer_hash = 'ATTACK AT DAWN',
    answer_type = 'TEXT',
    puzzle_context = 'Cryptanalysis'
WHERE id = 7;

UPDATE questions SET
    question_content = 'You must determine the Caesar cipher shift value for your teammate.\n\nYou know the following:\n- The cipher used a forward alphabetic shift\n- The original plaintext starts with the letter "A"\n- The first letter of the ciphertext (which your teammate has) is "D"\n\nCalculate the shift value and share it with your teammate.\n\nNow, your teammate will tell you the decoded plaintext.\nTake the decoded message, count the total number of letters (ignore spaces), and compute:\n(letter_count * shift_value) + 12\n\nEnter the final numeric result.',
    expected_answer_hash = '48',
    answer_type = 'NUMERIC',
    puzzle_context = 'Cryptanalysis'
WHERE id = 8;

-- Verification for Level 4:
-- Shift: D - A = 3. So shift = 3.
-- P1 decrypts "DWWDFN DW GDZQ" with shift 3: A T T A C K   A T   D A W N → "ATTACK AT DAWN" ✓
-- P2: plaintext = "ATTACK AT DAWN", letters (no spaces) = 12 letters.
--     (12 * 3) + 12 = 36 + 12 = 48 ✓

-- ============================================================
-- LEVEL 5: Systems / Concurrency / Debugging (EXPERT)
-- Interdependency: P1 has thread execution order, P2 has resource dependency graph.
-- ============================================================
UPDATE questions SET
    question_content = 'You are debugging a multi-threaded application. Four threads attempt to acquire two locks:\n\nThread execution log (chronological):\n1. Thread-A acquires Lock-X\n2. Thread-B acquires Lock-Y\n3. Thread-C waits for Lock-X\n4. Thread-A requests Lock-Y (BLOCKED)\n5. Thread-B requests Lock-X (BLOCKED)\n6. Thread-D acquires Lock-Z\n\nYour teammate has the resource dependency graph.\nTell them which two threads are blocked and which locks they each hold and want.\n\nQuestion: In a standard deadlock resolution using "kill the thread with the lower ID",\nwhich thread would be terminated to resolve the deadlock?\n\nEnter the thread name (e.g., Thread-A).',
    expected_answer_hash = 'Thread-A',
    answer_type = 'TEXT',
    puzzle_context = 'Deadlock Analysis'
WHERE id = 9;

UPDATE questions SET
    question_content = 'You have the resource allocation graph for a concurrent system:\n\n- Lock-X → currently held by ???\n- Lock-Y → currently held by ???\n- Lock-Z → currently held by Thread-D\n- Thread-C → waiting for Lock-X\n\nYour teammate has the execution log. Ask them:\n1. Which thread holds Lock-X?\n2. Which thread holds Lock-Y?\n3. Which threads are in the deadlock cycle?\n\nFill in the resource graph and verify the circular wait.\n\nAfter the deadlock is resolved (your teammate knows which thread is terminated),\nthe terminated thread releases its lock.\n\nHow many threads will be in RUNNABLE state after resolution?\n(Count threads that are either running or can now proceed. Thread-D is always runnable.\nThread-C was waiting for Lock-X.)\n\nEnter the count.',
    expected_answer_hash = '3',
    answer_type = 'NUMERIC',
    puzzle_context = 'Deadlock Analysis'
WHERE id = 10;

-- Verification for Level 5:
-- Deadlock: Thread-A holds Lock-X, wants Lock-Y. Thread-B holds Lock-Y, wants Lock-X. Circular wait.
-- Kill lower ID: Thread-A is terminated. Thread-A releases Lock-X.
-- After resolution: Thread-B gets Lock-X (was waiting) → RUNNABLE.
--   Thread-C was waiting for Lock-X → Lock-X was released by A, but B got it. After B finishes, C gets it.
--   Actually: Thread-A killed → releases Lock-X. Thread-B was blocked on Lock-X → now gets Lock-X → RUNNABLE.
--   Thread-C was waiting for Lock-X → still waiting (B has it). Thread-D → RUNNABLE.
--   So RUNNABLE: Thread-B, Thread-D = 2. Hmm.
--   Wait: after A is killed and releases Lock-X, who gets it? B requested it at step 5 (before C's wait at step 3).
--   Actually C started waiting at step 3 (before B's request at step 5), so C should get Lock-X first.
--   But B already holds Lock-Y. If C gets Lock-X, then: B still has Lock-Y and needs Lock-X. C has Lock-X.
--   So: Thread-B (holds Lock-Y, still needs Lock-X) - still blocked? No, with A killed, B was requesting Lock-X.
--   C was waiting since step 3, B requested at step 5. C was first in the wait queue.
--   C gets Lock-X → RUNNABLE. B still blocked waiting for Lock-X. D is RUNNABLE.
--   RUNNABLE: C, D = 2. Let me fix the answer.
UPDATE questions SET expected_answer_hash = '2' WHERE id = 10;

-- Hmm, but that makes it tricky. Let me reconsider. The question says "how many threads will be in RUNNABLE state after resolution." Let me think more carefully.
-- After Thread-A is killed: releases Lock-X.
-- Thread-C was waiting for Lock-X (step 3) → gets Lock-X → RUNNABLE
-- Thread-B holds Lock-Y, was blocked on Lock-X (step 5) → still blocked (C has Lock-X now)
-- Thread-D holds Lock-Z → RUNNABLE
-- RUNNABLE: Thread-C, Thread-D = 2. ✓

-- ============================================================
-- LEVEL 6: Mixed Advanced CS (EXTREME)
-- Interdependency: P1 has hash function parameters, P2 has data to hash.
-- They must combine to solve a distributed consensus verification problem.
-- ============================================================
UPDATE questions SET
    question_content = 'You are verifying a blockchain-style hash chain. You have the hash function parameters:\n\nHash function: H(data) = (sum_of_ASCII_values_of_data * 31 + previous_hash) % 997\n\nThe chain starts with genesis hash = 0.\n\nYour teammate has the data for each block.\nAsk them for the data strings for Block 1, Block 2, and Block 3 (in order).\n\nCompute the hash chain:\n- Block 1 hash = H(block1_data) with previous_hash = 0\n- Block 2 hash = H(block2_data) with previous_hash = Block 1 hash\n- Block 3 hash = H(block3_data) with previous_hash = Block 2 hash\n\nWhat is the final Block 3 hash value?\n\nEnter the numeric result.',
    expected_answer_hash = '553',
    answer_type = 'NUMERIC',
    puzzle_context = 'Distributed Consensus'
WHERE id = 11;

UPDATE questions SET
    question_content = 'You have the block data for a hash chain verification:\n\nBlock 1 data: "NODE"\nBlock 2 data: "SYNC"\nBlock 3 data: "DONE"\n\nShare these with your teammate — they have the hash function.\n\nYour teammate will tell you the final Block 3 hash.\n\nNow verify: A fourth block is proposed with data "FAIL".\nCompute its hash using the same function:\nH(data) = (sum_of_ASCII_values * 31 + previous_hash) % 997\nwhere previous_hash = the Block 3 hash from your teammate.\n\nA consensus rule states: a block is ACCEPTED if its hash is an ODD number, REJECTED if EVEN.\n\nIs Block 4 ACCEPTED or REJECTED?\n\nEnter: ACCEPTED or REJECTED',
    expected_answer_hash = 'REJECTED',
    answer_type = 'TEXT',
    puzzle_context = 'Distributed Consensus'
WHERE id = 12;

-- Verification for Level 6:
-- Block 1: "NODE" → N=78, O=79, D=68, E=69 → sum=294. H = (294*31 + 0) % 997 = 9114 % 997 = 9114 - 9*997 = 9114 - 8973 = 141
-- Block 2: "SYNC" → S=83, Y=89, N=78, C=67 → sum=317. H = (317*31 + 141) % 997 = (9827 + 141) % 997 = 9968 % 997 = 9968 - 9*997 = 9968 - 8973 = 995
-- Block 3: "DONE" → D=68, O=79, N=78, E=69 → sum=294. H = (294*31 + 995) % 997 = (9114 + 995) % 997 = 10109 % 997 = 10109 - 10*997 = 10109 - 9970 = 139
-- Fix P1 answer:
UPDATE questions SET expected_answer_hash = '139' WHERE id = 11;

-- Block 4: "FAIL" → F=70, A=65, I=73, L=76 → sum=284. H = (284*31 + 139) % 997 = (8804 + 139) % 997 = 8943 % 997 = 8943 - 8*997 = 8943 - 7976 = 967
-- 967 is ODD → ACCEPTED
UPDATE questions SET expected_answer_hash = 'ACCEPTED' WHERE id = 12;

-- ============================================================
-- HINTS — Progressive passkey clues
-- Each hint provides one indirect constraint about the six-digit passkey.
-- The actual passkey is set via the admin API (bcrypt-hashed) and is NEVER in this file.
-- These hints use technical riddles that resolve to single digits.
-- ============================================================
UPDATE hints SET hint_content = 'Clue 1: The first digit of the final passkey is the number of bits needed to represent the decimal value 9 in binary (minimum bits, no leading zeros).', display_order = 1 WHERE id = 1;
UPDATE hints SET hint_content = 'Clue 2: The second digit equals the number of layers in the TCP/IP model (not the OSI model).', display_order = 2 WHERE id = 2;
UPDATE hints SET hint_content = 'Clue 3: The third digit is the result of: 15 XOR 8 XOR 6 (bitwise XOR in sequence).', display_order = 3 WHERE id = 3;
UPDATE hints SET hint_content = 'Clue 4: The fourth digit is the smallest prime number greater than 4.', display_order = 4 WHERE id = 4;
UPDATE hints SET hint_content = 'Clue 5: The fifth digit is the exit code returned by a Unix process that terminates successfully.', display_order = 5 WHERE id = 5;
UPDATE hints SET hint_content = 'Clue 6: The sixth digit is the number of bytes in a single ASCII character.', display_order = 6 WHERE id = 6;

-- Hint solutions (for organizer reference, NOT revealed to players):
-- Clue 1: 9 in binary = 1001 → 4 bits. Digit = 4
-- Clue 2: TCP/IP model = 4 layers. Digit = 4
-- Clue 3: 15 XOR 8 = 7, 7 XOR 6 = 1. Digit = 1
-- Clue 4: Smallest prime > 4 = 5. Digit = 5
-- Clue 5: Unix success exit code = 0. Digit = 0
-- Clue 6: 1 byte per ASCII char. Digit = 1
-- PASSKEY = 441501 (set via admin API, bcrypt-hashed, NEVER hardcoded)
