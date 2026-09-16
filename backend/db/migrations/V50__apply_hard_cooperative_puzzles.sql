-- V50: Apply Hard Cooperative Technical Puzzle Set from CODEXCAPE_HARD_COOPERATIVE_QUESTIONS_AND_PUZZLES.md
-- Two-player asymmetric cooperative escape room: exactly 6 levels and 15 stages (2, 2, 2, 3, 3, 3).
-- P1 receives Fragment A, P2 receives Fragment B. Neither alone is sufficient. Team submits combined answer.
-- ZERO answers in player-facing instructions, zero leakage.

-- =========================================================================
-- 1. LEVEL 1: SYSTEM AWAKENING (2 Stages)
-- =========================================================================

-- Level 1 Stage 1: Corrupted Execution Trace (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
CORRUPTED EXECUTION TRACE // RECONSTRUCTION

Initial state:
x = 7
y = 3

The process performs exactly 6 iterations.

At iteration i:
1. x = x + (i * 2)
2. If x is divisible by 3:
      x = x / 3
   Otherwise:
      x = x + 1',
    instructions = 'Communicate with Player 2 to trace each iteration step-by-step. Submit the final values of x and y after iteration 6 in format: x=..., y=...',
    puzzle_context = 'LEVEL 1 / STAGE 1: CORRUPTED EXECUTION TRACE',
    expected_answer_hash = '48, 34',
    answer_type = 'TEXT',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 1 Stage 1: Corrupted Execution Trace (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
CORRUPTED EXECUTION TRACE // RECONSTRUCTION

After Player 1''s transformation:

If x is even:
    y = y + x / 2

If x is odd:
    y = y - i

The next iteration starts with the resulting x and y.
Record i, x, y after every iteration.',
    instructions = 'Communicate with Player 1 to trace each iteration step-by-step. Submit the final values of x and y after iteration 6 in format: x=..., y=...',
    puzzle_context = 'LEVEL 1 / STAGE 1: CORRUPTED EXECUTION TRACE',
    expected_answer_hash = '48, 34',
    answer_type = 'TEXT',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 1 Stage 2: Python Trace Reconstruction (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
PYTHON TRACE RECONSTRUCTION

data = [4, 7, 2, 9, 5, 8]

a = data[1:5]
a.reverse()

for i in range(len(a)):
    a[i] = a[i] - i',
    instructions = 'Coordinate with Player 2 to trace list transformations and submit the exact final printed list.',
    puzzle_context = 'LEVEL 1 / STAGE 2: PYTHON TRACE RECONSTRUCTION',
    expected_answer_hash = '[4, 7, 8, 9, 5, 8]',
    answer_type = 'TEXT',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 1 Stage 2: Python Trace Reconstruction (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
PYTHON TRACE RECONSTRUCTION

After the loop:

b = data[::2]
b.append(a[1])
data[2] = b[-1]
print(data)

Rules:
- data[1:5] creates a new list.
- reverse() changes a, not data.
- data[::2] creates a new list.
- data[2] changes the original data.',
    instructions = 'Coordinate with Player 1 to trace list transformations and submit the exact final printed list.',
    puzzle_context = 'LEVEL 1 / STAGE 2: PYTHON TRACE RECONSTRUCTION',
    expected_answer_hash = '[4, 7, 8, 9, 5, 8]',
    answer_type = 'TEXT',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Ensure Level 1 Stage 3 is inactive
UPDATE questions SET is_active = false
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 3;


-- =========================================================================
-- 2. LEVEL 2: THE LOCKED ARCHIVE (2 Stages)
-- =========================================================================

-- Level 2 Stage 1: Stack + Queue Transmission (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
STACK + QUEUE TRANSMISSION

Stack S starts empty.

PUSH 4
PUSH 9
PUSH 2
POP -> move removed value into Queue Q
PUSH 7
POP -> move removed value into Queue Q

Queue Q starts empty.
Stack uses LIFO.',
    instructions = 'Communicate with Player 2 to trace stack and queue states. Determine the final queue order from front to back.',
    puzzle_context = 'LEVEL 2 / STAGE 1: STACK + QUEUE TRANSMISSION',
    expected_answer_hash = '7, 5, 8',
    answer_type = 'TEXT',
    technical_category = 'DATA-STRUCTURES',
    difficulty = 'HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 2 Stage 1: Stack + Queue Transmission (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
STACK + QUEUE TRANSMISSION

Continue:

PUSH 5 into S
POP from S -> move to Q

Remove the front value from Q.
PUSH that removed value into S.

PUSH 8 into S
POP from S -> move to Q

Queue uses FIFO.

Determine Q from front to back.',
    instructions = 'Communicate with Player 1 to trace stack and queue states. Determine the final queue order from front to back.',
    puzzle_context = 'LEVEL 2 / STAGE 1: STACK + QUEUE TRANSMISSION',
    expected_answer_hash = '7, 5, 8',
    answer_type = 'TEXT',
    technical_category = 'DATA-STRUCTURES',
    difficulty = 'HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 2 Stage 2: Binary Search Interrogation (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
BINARY SEARCH INTERROGATION

Sorted identifiers:

11, 18, 24, 31, 39, 47, 55, 63,
72, 81, 90, 101, 115, 129, 144

Recorded binary-search midpoint values:
72
39
55
63',
    instructions = 'Cross-reference with Player 2 to identify the target and state the worst-case Big-O complexity in format: TARGET | O(...)',
    puzzle_context = 'LEVEL 2 / STAGE 2: BINARY SEARCH INTERROGATION',
    expected_answer_hash = '63 | O(log n)',
    answer_type = 'TEXT',
    technical_category = 'ALGORITHMS',
    difficulty = 'HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 2 Stage 2: Binary Search Interrogation (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
BINARY SEARCH INTERROGATION

Binary search:
- Start with the complete sorted range.
- Select the middle element.
- If target < midpoint, use lower half.
- If target > midpoint, use upper half.
- If equal, search ends.

The recorded sequence contains every comparison until the target.
Also determine worst-case time complexity.',
    instructions = 'Cross-reference with Player 1 to identify the target and state the worst-case Big-O complexity in format: TARGET | O(...)',
    puzzle_context = 'LEVEL 2 / STAGE 2: BINARY SEARCH INTERROGATION',
    expected_answer_hash = '63 | O(log n)',
    answer_type = 'TEXT',
    technical_category = 'ALGORITHMS',
    difficulty = 'HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Ensure Level 2 Stage 3 is inactive
UPDATE questions SET is_active = false
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 3;


-- =========================================================================
-- 3. LEVEL 3: NETWORK SHADOW (2 Stages)
-- =========================================================================

-- Level 3 Stage 1: Packet Path Reconstruction (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
PACKET PATH RECONSTRUCTION

Source: 10.0.2.15
Destination: 10.0.5.20

Observed hops:
10.0.2.1
10.0.3.1
10.0.5.1

Destination is reached after the third router.
Application requires reliable delivery.',
    instructions = 'Combine hop data with Player 2''s routing rules. Submit in format: SOURCE -> HOP 1 -> HOP 2 -> HOP 3 -> DESTINATION | PROTOCOL',
    puzzle_context = 'LEVEL 3 / STAGE 1: PACKET PATH RECONSTRUCTION',
    expected_answer_hash = '10.0.2.15 -> 10.0.2.1 -> 10.0.3.1 -> 10.0.5.1 -> 10.0.5.20 | TCP',
    answer_type = 'TEXT',
    technical_category = 'NETWORKING',
    difficulty = 'VERY-HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 3 Stage 1: Packet Path Reconstruction (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
PACKET PATH RECONSTRUCTION

Routing:
10.0.2.1 -> forwards 10.0.3.0/24
10.0.3.1 -> forwards 10.0.5.0/24
10.0.5.1 -> forwards to local destination

Destination port = 443

TCP: reliable, ordered delivery, retransmission
UDP: lower overhead, no delivery guarantee

Choose protocol according to the application requirement.',
    instructions = 'Combine routing rules with Player 1''s observed hops. Submit in format: SOURCE -> HOP 1 -> HOP 2 -> HOP 3 -> DESTINATION | PROTOCOL',
    puzzle_context = 'LEVEL 3 / STAGE 1: PACKET PATH RECONSTRUCTION',
    expected_answer_hash = '10.0.2.15 -> 10.0.2.1 -> 10.0.3.1 -> 10.0.5.1 -> 10.0.5.20 | TCP',
    answer_type = 'TEXT',
    technical_category = 'NETWORKING',
    difficulty = 'VERY-HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 3 Stage 2: Subnet Forensics (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
SUBNET FORENSICS

Network:
172.16.40.64/27

Observed:
172.16.40.65
172.16.40.78
172.16.40.94
172.16.40.97',
    instructions = 'Combine network prefix with Player 2''s calculations. Submit the usable range and classification in format: USABLE_START - USABLE_END | OPTION',
    puzzle_context = 'LEVEL 3 / STAGE 2: SUBNET FORENSICS',
    expected_answer_hash = '172.16.40.65 - 172.16.40.94 | C',
    answer_type = 'TEXT',
    technical_category = 'NETWORKING',
    difficulty = 'VERY-HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 3 Stage 2: Subnet Forensics (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
SUBNET FORENSICS

/27 leaves 5 host bits.

Determine:
- total addresses
- network address
- broadcast address
- usable host range

Classify:
172.16.40.94

A. Network
B. Broadcast
C. Usable host
D. Outside subnet',
    instructions = 'Combine subnet calculations with Player 1''s network prefix. Submit the usable range and classification in format: USABLE_START - USABLE_END | OPTION',
    puzzle_context = 'LEVEL 3 / STAGE 2: SUBNET FORENSICS',
    expected_answer_hash = '172.16.40.65 - 172.16.40.94 | C',
    answer_type = 'TEXT',
    technical_category = 'NETWORKING',
    difficulty = 'VERY-HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Ensure Level 3 Stage 3 is inactive
UPDATE questions SET is_active = false
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 3;


-- =========================================================================
-- 4. LEVEL 4: CORE SYSTEM BREACH (3 Stages)
-- =========================================================================

-- Level 4 Stage 1: SQL Evidence Merge (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
SQL EVIDENCE MERGE

students
student_id | name   | department
101        | Asha   | CSE
102        | Bala   | ECE
103        | Chitra | CSE
104        | Dev    | IT

marks
student_id | subject | mark
101        | DBMS    | 88
101        | OS      | 91
103        | DBMS    | 84
103        | OS      | 79
104        | DBMS    | 92

Requirement:
Find CSE students whose average recorded mark is > 80.',
    instructions = 'Combine table records with Player 2''s query structure. Determine qualifying CSE students separated by comma.',
    puzzle_context = 'LEVEL 4 / STAGE 1: SQL EVIDENCE MERGE',
    expected_answer_hash = 'ASHA, CHITRA',
    answer_type = 'TEXT',
    technical_category = 'DATABASES',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 4 Stage 1: SQL Evidence Merge (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
SQL EVIDENCE MERGE

Use:
JOIN through student_id
WHERE for department filtering
GROUP BY student
HAVING for aggregate conditions

Required query structure:
SELECT ...
FROM students s
JOIN marks m ...
WHERE ...
GROUP BY ...
HAVING ...',
    instructions = 'Combine query structure with Player 1''s table records. Determine qualifying CSE students separated by comma.',
    puzzle_context = 'LEVEL 4 / STAGE 1: SQL EVIDENCE MERGE',
    expected_answer_hash = 'ASHA, CHITRA',
    answer_type = 'TEXT',
    technical_category = 'DATABASES',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 4 Stage 2: Web Request Autopsy (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
WEB REQUEST AUTOPSY

Request:
POST /api/profile

Payload:
{"name":"Asha"}

Server:
- route exists
- request reached application
- body is valid
- authenticated user is known
- unexpected database failure occurs while writing the profile',
    instructions = 'Analyze incident report with Player 2''s HTTP specifications. Submit the correct HTTP status code.',
    puzzle_context = 'LEVEL 4 / STAGE 2: WEB REQUEST AUTOPSY',
    expected_answer_hash = '500',
    answer_type = 'TEXT',
    technical_category = 'WEB-DEVELOPMENT',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 4 Stage 2: Web Request Autopsy (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
WEB REQUEST AUTOPSY

200 = success
201 = created
400 = invalid request
401 = authentication failure
403 = authenticated but forbidden
404 = resource not found
500 = unexpected server-side failure

The operation is a profile update.',
    instructions = 'Analyze HTTP status definitions with Player 1''s incident log. Submit the correct HTTP status code.',
    puzzle_context = 'LEVEL 4 / STAGE 2: WEB REQUEST AUTOPSY',
    expected_answer_hash = '500',
    answer_type = 'TEXT',
    technical_category = 'WEB-DEVELOPMENT',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 4 Stage 3: Git Branch Collision (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
GIT BRANCH COLLISION

main originally:
const mode = "production";

feature was created from that version and changed it to:
const mode = "debug";

Feature change was committed.',
    instructions = 'Correlate branch history with Player 2''s collision report. Choose the required resolution action (A, B, C, or D).',
    puzzle_context = 'LEVEL 4 / STAGE 3: GIT BRANCH COLLISION',
    expected_answer_hash = 'A',
    answer_type = 'TEXT',
    technical_category = 'VERSION-CONTROL',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 4 Stage 3: Git Branch Collision (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
GIT BRANCH COLLISION

Later, main independently changed the same line to:
const mode = "safe";

Then:
git checkout main
git merge feature

Git reports a conflict in app.js.

A. Resolve conflict, stage file, complete merge commit
B. Delete repository
C. Clone again
D. Push without resolving',
    instructions = 'Correlate collision report with Player 1''s branch history. Choose the required resolution action (A, B, C, or D).',
    puzzle_context = 'LEVEL 4 / STAGE 3: GIT BRANCH COLLISION',
    expected_answer_hash = 'A',
    answer_type = 'TEXT',
    technical_category = 'VERSION-CONTROL',
    difficulty = 'VERY-HARD-PLUS',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 3 AND player_number = 'PLAYER_2';


-- =========================================================================
-- 5. LEVEL 5: ENCRYPTED MEMORY (3 Stages)
-- =========================================================================

-- Level 5 Stage 1: Multi-Layer Encoding Forensics (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
MULTI-LAYER ENCODING FORENSICS

Recovered fragment:

53 47 56 73 62 47 38 3d

These are hexadecimal representations of ASCII characters.
Convert hex -> ASCII first.',
    instructions = 'Convert hex to ASCII and coordinate with Player 2 to complete the second decoding transformation. Submit the final readable message.',
    puzzle_context = 'LEVEL 5 / STAGE 1: MULTI-LAYER ENCODING FORENSICS',
    expected_answer_hash = 'Hello',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 5 Stage 1: Multi-Layer Encoding Forensics (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
MULTI-LAYER ENCODING FORENSICS

The resulting ASCII string is Base64.

Procedure:
1. Hex -> ASCII
2. Treat resulting text as Base64
3. Base64 decode
4. Interpret resulting bytes as ASCII',
    instructions = 'Coordinate with Player 1 to receive the intermediate ASCII string and decode the Base64 payload. Submit the final readable message.',
    puzzle_context = 'LEVEL 5 / STAGE 1: MULTI-LAYER ENCODING FORENSICS',
    expected_answer_hash = 'Hello',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 5 Stage 2: Security Incident Correlation (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
SECURITY INCIDENT CORRELATION

09:14 — Ravi logs in successfully.
09:15 — Ravi requests /admin/reports.
09:15 — Server identifies Ravi as authenticated.
09:15 — Request rejected because Ravi lacks admin privileges.
09:17 — Another Ravi login attempt fails due to wrong password.',
    instructions = 'Analyze security logs with Player 2''s security model. Identify the security control responsible for rejecting the 09:15 request.',
    puzzle_context = 'LEVEL 5 / STAGE 2: SECURITY INCIDENT CORRELATION',
    expected_answer_hash = 'AUTHORIZATION',
    answer_type = 'TEXT',
    technical_category = 'CYBERSECURITY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 5 Stage 2: Security Incident Correlation (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
SECURITY INCIDENT CORRELATION

Authentication = verifies identity.
Authorization = determines permitted access.
Hashing = one-way password representation.

There are two different security events.
Identify the security control involved in the 09:15 event.',
    instructions = 'Analyze security definitions with Player 1''s incident log. Identify the security control responsible for rejecting the 09:15 request.',
    puzzle_context = 'LEVEL 5 / STAGE 2: SECURITY INCIDENT CORRELATION',
    expected_answer_hash = 'AUTHORIZATION',
    answer_type = 'TEXT',
    technical_category = 'CYBERSECURITY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 5 Stage 3: Cipher Chain (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
CIPHER CHAIN

ASCII decimal sequence:

75 72 78 78 82

Convert decimal -> uppercase ASCII characters first.',
    instructions = 'Convert ASCII decimal codes to characters, then coordinate with Player 2 to decrypt the Caesar cipher. Submit the original decoded message.',
    puzzle_context = 'LEVEL 5 / STAGE 3: CIPHER CHAIN',
    expected_answer_hash = 'HEKKO',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 5 Stage 3: Cipher Chain (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
CIPHER CHAIN

The resulting uppercase text was encrypted using Caesar +3.

Decrypt by shifting each alphabetic character backward by 3.
Preserve order.',
    instructions = 'Coordinate with Player 1 to receive the uppercase string and reverse the Caesar +3 shift. Submit the original decoded message.',
    puzzle_context = 'LEVEL 5 / STAGE 3: CIPHER CHAIN',
    expected_answer_hash = 'HEKKO',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_2';


-- =========================================================================
-- 6. LEVEL 6: NODE ZERO (3 Stages)
-- =========================================================================

-- Level 6 Stage 1: Java Polymorphism Trace (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
JAVA POLYMORPHISM TRACE

class A {
    void show() {
        System.out.print("A");
    }
}

class B extends A {
    @Override
    void show() {
        System.out.print("B");
    }

    void extra() {
        System.out.print("X");
    }
}

class C extends B {
    @Override
    void show() {
        System.out.print("C");
    }
}',
    instructions = 'Coordinate class definitions with Player 2''s execution statements. Determine the exact output sequence printed.',
    puzzle_context = 'LEVEL 6 / STAGE 1: JAVA POLYMORPHISM TRACE',
    expected_answer_hash = 'CCX',
    answer_type = 'TEXT',
    technical_category = 'OBJECT-ORIENTED-PROGRAMMING',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 6 Stage 1: Java Polymorphism Trace (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
JAVA POLYMORPHISM TRACE

A first = new C();
B second = new C();

first.show();
second.show();
second.extra();

Concepts:
- Reference type controls accessible members.
- Runtime polymorphism selects the overridden method.
- C inherits B.extra() because C does not override it.',
    instructions = 'Coordinate execution statements with Player 1''s class definitions. Determine the exact output sequence printed.',
    puzzle_context = 'LEVEL 6 / STAGE 1: JAVA POLYMORPHISM TRACE',
    expected_answer_hash = 'CCX',
    answer_type = 'TEXT',
    technical_category = 'OBJECT-ORIENTED-PROGRAMMING',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 6 Stage 2: Docker Deployment Failure (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
DOCKER DEPLOYMENT FAILURE

Application listens inside container on:
0.0.0.0:8080

Inside container:
curl http://localhost:8080
works.

Host requirement:
http://localhost:3000',
    instructions = 'Cross-reference container port and host requirement with Player 2''s Docker mapping candidates. Select the correct option (A, B, C, or D).',
    puzzle_context = 'LEVEL 6 / STAGE 2: DOCKER DEPLOYMENT FAILURE',
    expected_answer_hash = 'A',
    answer_type = 'TEXT',
    technical_category = 'DEVOPS-CONTAINERS',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 6 Stage 2: Docker Deployment Failure (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
DOCKER DEPLOYMENT FAILURE

Current command:
docker run -p 8080:3000 app

Docker format:
HOST_PORT:CONTAINER_PORT

Candidates:
A. -p 3000:8080
B. -p 8080:3000
C. -p 3000:3000
D. no port mapping',
    instructions = 'Cross-reference Docker mapping syntax with Player 1''s container port telemetry. Select the correct option (A, B, C, or D).',
    puzzle_context = 'LEVEL 6 / STAGE 2: DOCKER DEPLOYMENT FAILURE',
    expected_answer_hash = 'A',
    answer_type = 'TEXT',
    technical_category = 'DEVOPS-CONTAINERS',
    difficulty = 'EXPERT',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 6 Stage 3: NODE ZERO: Final Distributed Logic Breach (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
NODE ZERO: FINAL DISTRIBUTED LOGIC BREACH

Shared Mission:
Four engineers each have one specialty, one day, and one system responsibility. No value repeats.

Engineers:
Asha, Bala, Chitra, Dev

Specialties:
Python, Java, SQL, C++

Days:
Monday, Tuesday, Wednesday, Thursday

Responsibilities:
Database, API, Networks, Security

Clues:
1. Asha works Tuesday.
2. Java specialist works Thursday.
3. Database engineer works Monday.
4. Bala is not Python.
5. Chitra works after Asha.
6. Dev is C++ specialist.',
    instructions = 'Collaborate with Player 2 to construct the complete deduction grid. Determine which engineer is responsible for Networks.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL DISTRIBUTED LOGIC BREACH',
    expected_answer_hash = 'CHITRA',
    answer_type = 'TEXT',
    technical_category = 'DISTRIBUTED-SYSTEMS-LOGIC',
    difficulty = 'EXPERT-FINAL',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 6 Stage 3: NODE ZERO: Final Distributed Logic Breach (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
NODE ZERO: FINAL DISTRIBUTED LOGIC BREACH

Shared Mission:
Four engineers each have one specialty, one day, and one system responsibility. No value repeats.

Clues:
7. Security engineer works Wednesday.
8. Bala works before the Java specialist.
9. SQL specialist is responsible for Database.
10. Chitra is not Security.
11. Python specialist works Tuesday.
12. Dev does not work Thursday.

Goal:
Determine the engineer responsible for Networks.',
    instructions = 'Collaborate with Player 1 to construct the complete deduction grid. Determine which engineer is responsible for Networks.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL DISTRIBUTED LOGIC BREACH',
    expected_answer_hash = 'CHITRA',
    answer_type = 'TEXT',
    technical_category = 'DISTRIBUTED-SYSTEMS-LOGIC',
    difficulty = 'EXPERT-FINAL',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_2';


-- =========================================================================
-- 7. SEED AUTHORITATIVE 3-TIER HINTS FOR ALL 15 STAGES
-- =========================================================================

DELETE FROM hint_usage;
DELETE FROM hints WHERE level_id IN (SELECT id FROM levels WHERE level_number BETWEEN 1 AND 6);

-- Level 1 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Every iteration depends on the previous state.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'Test divisibility after the addition.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'Build one shared table: i | x | y across all 6 iterations.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;

-- Level 1 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Keep data, a, and b separate in memory.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'Slices create new lists here.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'Trace the mutation of data[2] specifically.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 1;

-- Level 2 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Track Stack S from bottom to top (LIFO).', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'Track Queue Q from front to back (FIFO).', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'The temporary Q -> S transfer changes later element order.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;

-- Level 2 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Start binary search at midpoint 72.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'Narrow the interval after every comparison.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'The final recorded midpoint is the target.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 2;

-- Level 3 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Match forwarding networks to the destination address.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'Port 443 alone does not determine transport protocol.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'Use the application''s strict reliability requirement.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;

-- Level 3 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'A /27 block contains exactly 32 total addresses.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'Start at network address .64.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'Check network and broadcast boundaries before classifying the candidate.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 3;

-- Level 4 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'Determine the JOIN condition on student_id first.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'Filter department = ''CSE'' before grouping.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'Average mark is an aggregate condition evaluated in HAVING.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'The route exists and the request reached the application.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'Authentication succeeded and body is valid.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'The failure occurs during server-side database processing.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 3
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'Compare the common ancestor and both branch versions.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 2, 'The same line was changed independently on main and feature.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 3, 'The conflict must be resolved and staged before merge completes.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 4;

-- Level 5 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, '53, 47, etc. are hexadecimal byte values.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'The intermediate ASCII string represents Base64.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'Order of operations: Hex -> ASCII -> Base64 decode -> plain text.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'The 09:15 event occurs after successful user authentication.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'Separate identity verification from permission checking.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'Access rejection due to insufficient role permissions is an Authorization issue.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 3
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'Do not Caesar-shift the decimal numbers.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 2, 'Convert decimal to ASCII characters first.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 3, 'Decryption reverses the +3 shift by moving backward by 3.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 5;

-- Level 6 Stage 1
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 1, 'For show(), inspect the runtime object created by new.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 2, 'For extra(), inspect class inheritance.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 1, 3, 'Do not confuse reference type with runtime object type.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 2
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 1, 'Read Docker port format: HOST_PORT:CONTAINER_PORT.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 2, 'The application listens internally on port 8080.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 2, 3, 'The host user must access it externally through port 3000.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 3
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 1, 'Start with fixed relationships (e.g. Asha on Tuesday, Python on Tuesday).', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 2, 'Connect specialty to responsibility (SQL is Database, C++ Dev is Wed Security).', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;
INSERT INTO hints (level_id, stage_number, display_order, hint_content, is_active, created_at, updated_at)
SELECT l.id, 3, 3, 'Build one complete grid: Engineer x Specialty x Day x Responsibility.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM levels l WHERE l.level_number = 6;

-- Ensure all players have is_active = true
UPDATE players SET is_active = true WHERE is_active IS NOT TRUE;
