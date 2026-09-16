-- V49: Replace existing puzzle system with authoritative technical puzzle set from CODEXCAPE_NEW_QUESTIONS_AND_PUZZLES.md
-- Final structure: exactly 6 levels and 15 stages (L1:2, L2:2, L3:2, L4:3, L5:3, L6:3)
-- Anti-spoiler: ZERO answers in player instructions, zero solution paths, zero auto-filling answers.

-- =========================================================================
-- 1. LEVEL 1: PROGRAMMING CORE (2 Stages)
-- =========================================================================

-- Level 1 Stage 1: Loop Interrogation (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
CODE TERMINAL // LOOP INTERROGATION

Consider the following pseudocode:

x = 2
y = 0

FOR i = 1 TO 4
    x = x + i
    IF x % 2 == 0
        y = y + x
    ELSE
        y = y - 1
    END IF
END FOR

QUESTION:
What is the final value of y?

Enter only the numeric value.',
    instructions = 'Trace the program carefully after each loop iteration. Cross-reference your step values with Player 2 and submit the final numeric value of y.',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOOP INTERROGATION',
    expected_answer_hash = '18',
    answer_type = 'NUMERIC',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 1 Stage 1: Loop Interrogation (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
CODE TERMINAL // LOOP INTERROGATION

Consider the following pseudocode:

x = 2
y = 0

FOR i = 1 TO 4
    x = x + i
    IF x % 2 == 0
        y = y + x
    ELSE
        y = y - 1
    END IF
END FOR

QUESTION:
What is the final value of y?

Enter only the numeric value.',
    instructions = 'Trace the program execution step-by-step. Verify your iteration table with Player 1 and submit the final numeric value of y.',
    puzzle_context = 'LEVEL 1 / STAGE 1: LOOP INTERROGATION',
    expected_answer_hash = '18',
    answer_type = 'NUMERIC',
    technical_category = 'PROGRAMMING-CORE',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 1 Stage 2: The Broken Function (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
DEBUG CONSOLE // BROKEN FUNCTION

The following Python function is intended to return
the largest number in a list.

def largest(values):
    largest = 0

    for value in values:
        if value > largest:
            largest = value

    return largest


TEST INPUT:

values = [-8, -3, -12, -5]

QUESTION:

The function produces an incorrect result for this input.

Identify the problem and determine what the function should
return for the given input.

Submit the corrected output value.',
    instructions = 'Analyze the initialization and execution of the function. Determine what the function should return for the given negative numbers and submit the corrected output value.',
    puzzle_context = 'LEVEL 1 / STAGE 2: THE BROKEN FUNCTION',
    expected_answer_hash = '-3',
    answer_type = 'NUMERIC',
    technical_category = 'PYTHON-DEBUGGING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 1 Stage 2: The Broken Function (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
DEBUG CONSOLE // BROKEN FUNCTION

The following Python function is intended to return
the largest number in a list.

def largest(values):
    largest = 0

    for value in values:
        if value > largest:
            largest = value

    return largest


TEST INPUT:

values = [-8, -3, -12, -5]

QUESTION:

The function produces an incorrect result for this input.

Identify the problem and determine what the function should
return for the given input.

Submit the corrected output value.',
    instructions = 'Examine the logic flaw with Player 1. Determine what the function should return for the given negative numbers and submit the corrected output value.',
    puzzle_context = 'LEVEL 1 / STAGE 2: THE BROKEN FUNCTION',
    expected_answer_hash = '-3',
    answer_type = 'NUMERIC',
    technical_category = 'PYTHON-DEBUGGING',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 1) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- =========================================================================
-- 2. LEVEL 2: DATA STRUCTURES & ALGORITHMS (2 Stages)
-- =========================================================================

-- Level 2 Stage 1: Stack Lock (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
DATA STRUCTURE LOCK // STACK

An empty stack receives the following operations:

PUSH 7
PUSH 3
PUSH 9
POP
PUSH 4
PUSH 8
POP
POP

QUESTION:

What value remains at the TOP of the stack?

Enter only the number.',
    instructions = 'Simulate the stack operations following LIFO ordering. Enter only the numeric value remaining at the top of the stack.',
    puzzle_context = 'LEVEL 2 / STAGE 1: STACK LOCK',
    expected_answer_hash = '3',
    answer_type = 'NUMERIC',
    technical_category = 'DATA-STRUCTURES',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 2 Stage 1: Stack Lock (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
DATA STRUCTURE LOCK // STACK

An empty stack receives the following operations:

PUSH 7
PUSH 3
PUSH 9
POP
PUSH 4
PUSH 8
POP
POP

QUESTION:

What value remains at the TOP of the stack?

Enter only the number.',
    instructions = 'Track the stack contents after each push and pop. Confirm the top element with Player 1 and enter only the number.',
    puzzle_context = 'LEVEL 2 / STAGE 1: STACK LOCK',
    expected_answer_hash = '3',
    answer_type = 'NUMERIC',
    technical_category = 'DATA-STRUCTURES',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 2 Stage 2: Algorithm Race (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
ALGORITHM RACE

You must search for a value in a sorted array containing
1,000,000 elements.

Available strategies:

A. Check every element from left to right.
B. Repeatedly divide the remaining search range in half.
C. Randomly inspect elements until the target appears.
D. Compare every pair of elements.

QUESTION 1:
Which strategy is most appropriate for the sorted array?

QUESTION 2:
What is the approximate worst-case time complexity
of that strategy?

Submit in this format:
STRATEGY-[LETTER]-COMPLEXITY-[COMPLEXITY]',
    instructions = 'Identify the optimal search algorithm for a sorted array and its worst-case Big-O complexity. Format: STRATEGY-[LETTER]-COMPLEXITY-[COMPLEXITY]',
    puzzle_context = 'LEVEL 2 / STAGE 2: ALGORITHM RACE',
    expected_answer_hash = 'STRATEGY-B-COMPLEXITY-O(LOG N)',
    answer_type = 'TEXT',
    technical_category = 'ALGORITHMS-BIG-O',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 2 Stage 2: Algorithm Race (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
ALGORITHM RACE

You must search for a value in a sorted array containing
1,000,000 elements.

Available strategies:

A. Check every element from left to right.
B. Repeatedly divide the remaining search range in half.
C. Randomly inspect elements until the target appears.
D. Compare every pair of elements.

QUESTION 1:
Which strategy is most appropriate for the sorted array?

QUESTION 2:
What is the approximate worst-case time complexity
of that strategy?

Submit in this format:
STRATEGY-[LETTER]-COMPLEXITY-[COMPLEXITY]',
    instructions = 'Evaluate the 4 search strategies for sorted arrays. Determine strategy and worst-case complexity with Player 1. Format: STRATEGY-[LETTER]-COMPLEXITY-[COMPLEXITY]',
    puzzle_context = 'LEVEL 2 / STAGE 2: ALGORITHM RACE',
    expected_answer_hash = 'STRATEGY-B-COMPLEXITY-O(LOG N)',
    answer_type = 'TEXT',
    technical_category = 'ALGORITHMS-BIG-O',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 2) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- =========================================================================
-- 3. LEVEL 3: SYSTEMS & NETWORKS (2 Stages)
-- =========================================================================

-- Level 3 Stage 1: Packet Decision (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
NETWORK CONTROL ROOM

A multiplayer game needs to continuously send player movement
updates.

Requirements:

- Low latency is important.
- A small number of lost updates is acceptable.
- Waiting for retransmission can make movement feel delayed.
- The application can tolerate occasional missing packets.

QUESTION:

Which transport protocol is the better fit?

Choose one:
TCP
UDP',
    instructions = 'Evaluate transport protocol trade-offs for real-time game movement. Select the protocol that prioritizes low latency over reliability.',
    puzzle_context = 'LEVEL 3 / STAGE 1: PACKET DECISION',
    expected_answer_hash = 'UDP',
    answer_type = 'TEXT',
    technical_category = 'COMPUTER-NETWORKS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["TCP","UDP"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 3 Stage 1: Packet Decision (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
NETWORK CONTROL ROOM

A multiplayer game needs to continuously send player movement
updates.

Requirements:

- Low latency is important.
- A small number of lost updates is acceptable.
- Waiting for retransmission can make movement feel delayed.
- The application can tolerate occasional missing packets.

QUESTION:

Which transport protocol is the better fit?

Choose one:
TCP
UDP',
    instructions = 'Examine whether connection-oriented retransmission is acceptable for real-time state updates. Submit the optimal transport protocol.',
    puzzle_context = 'LEVEL 3 / STAGE 1: PACKET DECISION',
    expected_answer_hash = 'UDP',
    answer_type = 'TEXT',
    technical_category = 'COMPUTER-NETWORKS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["TCP","UDP"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 3 Stage 2: Address Puzzle (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
NETWORK ADDRESS PUZZLE

A private network uses:

192.168.10.0/24

Four devices are currently assigned:

Device A -> 192.168.10.14
Device B -> 192.168.10.27
Device C -> 192.168.10.63
Device D -> 192.168.10.200

A fifth device must be placed in the same subnet.

The network administrator says:

"The address must be a valid host address,
must not duplicate an existing address,
and must not be the network or broadcast address."

QUESTION:

Which address is a valid choice?

A. 192.168.10.0
B. 192.168.10.255
C. 192.168.10.27
D. 192.168.10.150

Submit the option letter.',
    instructions = 'Identify the valid, unassigned host IP address within the /24 subnet. Submit the option letter.',
    puzzle_context = 'LEVEL 3 / STAGE 2: ADDRESS PUZZLE',
    expected_answer_hash = 'D',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'NETWORKING-LOGIC',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 3 Stage 2: Address Puzzle (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
NETWORK ADDRESS PUZZLE

A private network uses:

192.168.10.0/24

Four devices are currently assigned:

Device A -> 192.168.10.14
Device B -> 192.168.10.27
Device C -> 192.168.10.63
Device D -> 192.168.10.200

A fifth device must be placed in the same subnet.

The network administrator says:

"The address must be a valid host address,
must not duplicate an existing address,
and must not be the network or broadcast address."

QUESTION:

Which address is a valid choice?

A. 192.168.10.0
B. 192.168.10.255
C. 192.168.10.27
D. 192.168.10.150

Submit the option letter.',
    instructions = 'Filter out the network address, broadcast address, and already-assigned host. Submit the option letter.',
    puzzle_context = 'LEVEL 3 / STAGE 2: ADDRESS PUZZLE',
    expected_answer_hash = 'D',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'NETWORKING-LOGIC',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 3) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Deactivate any Stage 3 questions for Levels 1, 2, 3
UPDATE questions SET is_active = false
WHERE stage_number = 3 AND level_id IN (SELECT id FROM levels WHERE level_number IN (1, 2, 3));

-- =========================================================================
-- 4. LEVEL 4: DATABASES, WEB & VERSION CONTROL (3 Stages)
-- =========================================================================

-- Level 4 Stage 1: SQL Filter (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
DATABASE TERMINAL

TABLE: STUDENTS

| id | name  | department | marks |
|----|-------|------------|-------|
| 1  | Arun  | CSE        | 82    |
| 2  | Meena | ECE        | 91    |
| 3  | Ravi  | CSE        | 74    |
| 4  | Sara  | CSE        | 95    |
| 5  | John  | EEE        | 88    |

QUESTION:

Which SQL query returns the names of CSE students
whose marks are greater than 80?

A.
SELECT name FROM students
WHERE department = ''CSE'' AND marks > 80;

B.
SELECT name FROM students
WHERE department = ''CSE'' OR marks > 80;

C.
SELECT name FROM students
WHERE department = ''ECE'' AND marks > 80;

D.
SELECT name FROM students
WHERE marks < 80 AND department = ''CSE'';

Submit the option letter.',
    instructions = 'Analyze the table and select the SQL query satisfying both filter criteria. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 1: SQL FILTER',
    expected_answer_hash = 'A',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'DBMS-SQL',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 4 Stage 1: SQL Filter (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
DATABASE TERMINAL

TABLE: STUDENTS

| id | name  | department | marks |
|----|-------|------------|-------|
| 1  | Arun  | CSE        | 82    |
| 2  | Meena | ECE        | 91    |
| 3  | Ravi  | CSE        | 74    |
| 4  | Sara  | CSE        | 95    |
| 5  | John  | EEE        | 88    |

QUESTION:

Which SQL query returns the names of CSE students
whose marks are greater than 80?

A.
SELECT name FROM students
WHERE department = ''CSE'' AND marks > 80;

B.
SELECT name FROM students
WHERE department = ''CSE'' OR marks > 80;

C.
SELECT name FROM students
WHERE department = ''ECE'' AND marks > 80;

D.
SELECT name FROM students
WHERE marks < 80 AND department = ''CSE'';

Submit the option letter.',
    instructions = 'Check which query uses the correct boolean operator and column comparisons. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 1: SQL FILTER',
    expected_answer_hash = 'A',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'DBMS-SQL',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 4 Stage 2: HTTP Response Lock (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
WEB SERVER DIAGNOSTICS

A client sends:

GET /dashboard

The server successfully receives the request,
but the requested dashboard resource does not exist.

QUESTION:

Which HTTP status code most appropriately represents
this situation?

A. 200
B. 301
C. 404
D. 500

Submit the option letter.',
    instructions = 'Determine the standard HTTP status code for a missing or non-existent requested resource. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 2: HTTP RESPONSE LOCK',
    expected_answer_hash = 'C',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'WEB-DEVELOPMENT',
    difficulty = 'EASY',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 4 Stage 2: HTTP Response Lock (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
WEB SERVER DIAGNOSTICS

A client sends:

GET /dashboard

The server successfully receives the request,
but the requested dashboard resource does not exist.

QUESTION:

Which HTTP status code most appropriately represents
this situation?

A. 200
B. 301
C. 404
D. 500

Submit the option letter.',
    instructions = 'Confirm the HTTP status code category for client request errors on non-existent endpoints. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 2: HTTP RESPONSE LOCK',
    expected_answer_hash = 'C',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'WEB-DEVELOPMENT',
    difficulty = 'EASY',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 4 Stage 3: Git Recovery (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
GIT RECOVERY TERMINAL

A developer has modified three files:

app.js
index.html
style.css

Only app.js should be included in the next commit.

Current state:

- app.js -> modified
- index.html -> modified
- style.css -> modified

The developer has NOT committed anything yet.

QUESTION:

Which command sequence stages only app.js and then
creates a commit?

A.
git add .
git commit -m "update"

B.
git add app.js
git commit -m "update"

C.
git commit app.js
git push app.js

D.
git add index.html style.css
git commit -m "update"

Submit the option letter.',
    instructions = 'Select the Git command sequence that stages strictly app.js and creates the commit. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 3: GIT RECOVERY',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'GIT-GITHUB',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 4 Stage 3: Git Recovery (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
GIT RECOVERY TERMINAL

A developer has modified three files:

app.js
index.html
style.css

Only app.js should be included in the next commit.

Current state:

- app.js -> modified
- index.html -> modified
- style.css -> modified

The developer has NOT committed anything yet.

QUESTION:

Which command sequence stages only app.js and then
creates a commit?

A.
git add .
git commit -m "update"

B.
git add app.js
git commit -m "update"

C.
git commit app.js
git push app.js

D.
git add index.html style.css
git commit -m "update"

Submit the option letter.',
    instructions = 'Differentiate between staging specific files versus staging all working directory modifications. Submit the option letter.',
    puzzle_context = 'LEVEL 4 / STAGE 3: GIT RECOVERY',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'GIT-GITHUB',
    difficulty = 'EASY-MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 4) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- =========================================================================
-- 5. LEVEL 5: SECURITY, CRYPTOGRAPHY & COMPUTING (3 Stages)
-- =========================================================================

-- Level 5 Stage 1: Hash or Encryption? (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
SECURITY CLASSIFICATION

A system stores user passwords.

The security engineer says:

"I need a one-way transformation.
I should be able to verify whether a submitted password
matches the stored value, but I should not need to recover
the original password from the stored representation."

QUESTION:

Which concept best fits this requirement?

A. Encryption
B. Hashing
C. Base64 encoding
D. Compression

Submit the option letter.',
    instructions = 'Identify the cryptographic concept that provides a one-way, irreversible transformation. Submit the option letter.',
    puzzle_context = 'LEVEL 5 / STAGE 1: HASH OR ENCRYPTION?',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'CYBERSECURITY-CRYPTOGRAPHY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 5 Stage 1: Hash or Encryption? (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
SECURITY CLASSIFICATION

A system stores user passwords.

The security engineer says:

"I need a one-way transformation.
I should be able to verify whether a submitted password
matches the stored value, but I should not need to recover
the original password from the stored representation."

QUESTION:

Which concept best fits this requirement?

A. Encryption
B. Hashing
C. Base64 encoding
D. Compression

Submit the option letter.',
    instructions = 'Evaluate whether password storage requires reversible decryption or irreversible verification. Submit the option letter.',
    puzzle_context = 'LEVEL 5 / STAGE 1: HASH OR ENCRYPTION?',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'CYBERSECURITY-CRYPTOGRAPHY',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 5 Stage 2: Authentication Gate (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
SECURITY GATE

A user successfully logs into an application.

The user then attempts to open:

/admin/delete-users

The server recognizes the user''s identity,
but the user does not have permission to perform
administrator-only actions.

QUESTION:

Which security concept is being enforced when
the server rejects this request?

A. Authentication
B. Authorization
C. Encryption
D. Hashing

Submit the option letter.',
    instructions = 'Distinguish between verifying who a user is versus determining what actions they are permitted to perform. Submit the option letter.',
    puzzle_context = 'LEVEL 5 / STAGE 2: AUTHENTICATION GATE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'CYBERSECURITY',
    difficulty = 'EASY',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 5 Stage 2: Authentication Gate (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
SECURITY GATE

A user successfully logs into an application.

The user then attempts to open:

/admin/delete-users

The server recognizes the user''s identity,
but the user does not have permission to perform
administrator-only actions.

QUESTION:

Which security concept is being enforced when
the server rejects this request?

A. Authentication
B. Authorization
C. Encryption
D. Hashing

Submit the option letter.',
    instructions = 'The user identity is verified, but privileges are insufficient. Identify the enforced security concept and submit the option letter.',
    puzzle_context = 'LEVEL 5 / STAGE 2: AUTHENTICATION GATE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'CYBERSECURITY',
    difficulty = 'EASY',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 5 Stage 3: Binary Cipher Puzzle (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
BINARY MESSAGE LOCK

You intercept this binary sequence:

01001000 01001001

The system states:

1. Each group contains exactly 8 bits.
2. Interpret each group as an unsigned binary number.
3. Convert each number using the standard ASCII character table.
4. Combine the resulting characters.

QUESTION:

What text is hidden in the binary sequence?

Enter the decoded text.',
    instructions = 'Convert each 8-bit group into decimal, find the corresponding ASCII character, and enter the decoded text.',
    puzzle_context = 'LEVEL 5 / STAGE 3: BINARY CIPHER PUZZLE',
    expected_answer_hash = 'HI',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY-BINARY-ASCII',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 5 Stage 3: Binary Cipher Puzzle (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
BINARY MESSAGE LOCK

You intercept this binary sequence:

01001000 01001001

The system states:

1. Each group contains exactly 8 bits.
2. Interpret each group as an unsigned binary number.
3. Convert each number using the standard ASCII character table.
4. Combine the resulting characters.

QUESTION:

What text is hidden in the binary sequence?

Enter the decoded text.',
    instructions = 'Decode the intercepted binary bytes into standard ASCII text with Player 1. Enter the decoded text.',
    puzzle_context = 'LEVEL 5 / STAGE 3: BINARY CIPHER PUZZLE',
    expected_answer_hash = 'HI',
    answer_type = 'TEXT',
    technical_category = 'CRYPTOGRAPHY-BINARY-ASCII',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 5) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- =========================================================================
-- 6. LEVEL 6: ADVANCED TECHNICAL CHALLENGES (3 Stages)
-- =========================================================================

-- Level 6 Stage 1: OOP Override (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
JAVA OUTPUT LOCK

class Animal {
    void speak() {
        System.out.println("A");
    }
}

class Dog extends Animal {
    @Override
    void speak() {
        System.out.println("D");
    }
}

Animal x = new Dog();
x.speak();

QUESTION:

What is printed?

A. A
B. D
C. AD
D. Nothing

Submit the option letter.',
    instructions = 'Trace polymorphic dynamic method dispatch in Java when invoking an overridden method on an instantiated subclass. Submit the option letter.',
    puzzle_context = 'LEVEL 6 / STAGE 1: OOP OVERRIDE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'JAVA-OOP',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_1';

-- Level 6 Stage 1: OOP Override (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
JAVA OUTPUT LOCK

class Animal {
    void speak() {
        System.out.println("A");
    }
}

class Dog extends Animal {
    @Override
    void speak() {
        System.out.println("D");
    }
}

Animal x = new Dog();
x.speak();

QUESTION:

What is printed?

A. A
B. D
C. AD
D. Nothing

Submit the option letter.',
    instructions = 'Consider whether the reference type or runtime object type controls method execution in Java. Submit the option letter.',
    puzzle_context = 'LEVEL 6 / STAGE 1: OOP OVERRIDE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'JAVA-OOP',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 1 AND player_number = 'PLAYER_2';

-- Level 6 Stage 2: Container Deployment Puzzle (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
DEPLOYMENT CONTROL

A web application runs inside a Docker container.

The application listens on port 8080 inside the container.

The administrator wants users to access it through:

http://server:3000

QUESTION:

Which port mapping correctly exposes the application?

A. 8080:3000
B. 3000:8080
C. 3000:3000
D. 8080:8080

Submit the option letter.

FORMAT:
HOST_PORT:CONTAINER_PORT',
    instructions = 'Determine the Docker port publishing syntax (HOST_PORT:CONTAINER_PORT) to route external port 3000 to internal port 8080. Submit the option letter.',
    puzzle_context = 'LEVEL 6 / STAGE 2: CONTAINER DEPLOYMENT PUZZLE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'DOCKER-DEVOPS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_1';

-- Level 6 Stage 2: Container Deployment Puzzle (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
DEPLOYMENT CONTROL

A web application runs inside a Docker container.

The application listens on port 8080 inside the container.

The administrator wants users to access it through:

http://server:3000

QUESTION:

Which port mapping correctly exposes the application?

A. 8080:3000
B. 3000:8080
C. 3000:3000
D. 8080:8080

Submit the option letter.

FORMAT:
HOST_PORT:CONTAINER_PORT',
    instructions = 'Verify host-to-container port mapping order with Player 1. Submit the option letter.',
    puzzle_context = 'LEVEL 6 / STAGE 2: CONTAINER DEPLOYMENT PUZZLE',
    expected_answer_hash = 'B',
    answer_type = 'MULTIPLE_CHOICE',
    technical_category = 'DOCKER-DEVOPS',
    difficulty = 'MEDIUM',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 2 AND player_number = 'PLAYER_2';

-- Level 6 Stage 3: Final Technical Logic Grid (Player 1)
UPDATE questions SET
    evidence = '[OPERATOR NODE 01 // TELEMETRY PERSPECTIVE]
FINAL LOGIC GRID

Four developers -- A, B, C and D -- each specialize in
a different area:

- Python
- Java
- SQL
- Networks

Each developer works on a different day:

- Monday
- Tuesday
- Wednesday
- Thursday

CLUES:

1. The Python developer works on Tuesday.
2. B works on Thursday.
3. C specializes in SQL.
4. The Networks specialist works after C.
5. A does not specialize in Java.
6. D does not work on Monday.
7. C works before B.
8. The Java specialist works on Monday.

QUESTION:

Determine the developer who specializes in Networks.

Submit only the developer letter.',
    instructions = 'Analyze the deduction clues to determine which developer specializes in Networks. Submit only the single developer letter.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL TECHNICAL LOGIC GRID',
    expected_answer_hash = 'B',
    answer_type = 'TEXT',
    technical_category = 'LOGICAL-THINKING',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_1';

-- Level 6 Stage 3: Final Technical Logic Grid (Player 2)
UPDATE questions SET
    evidence = '[ANALYZER NODE 02 // TELEMETRY PERSPECTIVE]
FINAL LOGIC GRID

Four developers -- A, B, C and D -- each specialize in
a different area:

- Python
- Java
- SQL
- Networks

Each developer works on a different day:

- Monday
- Tuesday
- Wednesday
- Thursday

CLUES:

1. The Python developer works on Tuesday.
2. B works on Thursday.
3. C specializes in SQL.
4. The Networks specialist works after C.
5. A does not specialize in Java.
6. D does not work on Monday.
7. C works before B.
8. The Java specialist works on Monday.

QUESTION:

Determine the developer who specializes in Networks.

Submit only the developer letter.',
    instructions = 'Work with Player 1 through the logic grid deduction. Identify the Networks specialist and submit only the developer letter.',
    puzzle_context = 'LEVEL 6 / STAGE 3: FINAL TECHNICAL LOGIC GRID',
    expected_answer_hash = 'B',
    answer_type = 'TEXT',
    technical_category = 'LOGICAL-THINKING',
    difficulty = 'HARD',
    validation_rules = 'NORMALIZED_TEXT_EXACT',
    puzzle_metadata = '{"options":["A","B","C","D"]}',
    is_active = true
WHERE level_id = (SELECT id FROM levels WHERE level_number = 6) AND stage_number = 3 AND player_number = 'PLAYER_2';

-- =========================================================================
-- 7. UPDATE HINTS: NON-SPOILING 3-TIER PROGRESSIVE HINTS FOR ALL 15 STAGES
-- =========================================================================

DELETE FROM hints WHERE 1=1;

-- Level 1 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Track x and y after every iteration. Do not calculate the final value mentally in one step.', 1, true
FROM levels l WHERE l.level_number = 1;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Evaluate the modulo check x % 2 == 0 carefully on each iteration from i = 1 to 4.', 2, true
FROM levels l WHERE l.level_number = 1;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'After i=1: x=3, y=-1. After i=2: x=5, y=-2. Continue tracing for i=3 and i=4.', 3, true
FROM levels l WHERE l.level_number = 1;

-- Level 1 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Ask yourself whether the initial value of largest is guaranteed to be smaller than every possible input.', 1, true
FROM levels l WHERE l.level_number = 1;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'All numbers in the test input are negative. Notice how 0 compares to them.', 2, true
FROM levels l WHERE l.level_number = 1;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Find the maximum value among [-8, -3, -12, -5] that a corrected function should return.', 3, true
FROM levels l WHERE l.level_number = 1;

-- Level 2 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'A stack follows LIFO: Last In, First Out.', 1, true
FROM levels l WHERE l.level_number = 2;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Write down the stack elements from bottom to top after each PUSH and POP.', 2, true
FROM levels l WHERE l.level_number = 2;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'After the final two POP operations, inspect the element remaining at the top of the stack.', 3, true
FROM levels l WHERE l.level_number = 2;

-- Level 2 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'The array is sorted. Use that property to eliminate half the elements in each step.', 1, true
FROM levels l WHERE l.level_number = 2;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Think about how many elements remain after each comparison in binary search.', 2, true
FROM levels l WHERE l.level_number = 2;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Which strategy repeatedly divides the search range in half, and what is its logarithmic complexity?', 3, true
FROM levels l WHERE l.level_number = 2;

-- Level 3 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Consider whether reliable delivery or low-latency delivery is more important for real-time movement.', 1, true
FROM levels l WHERE l.level_number = 3;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'TCP uses acknowledgments and retransmission, causing latency spikes when packets drop.', 2, true
FROM levels l WHERE l.level_number = 3;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Which protocol sends datagrams without waiting for retransmissions or handshakes?', 3, true
FROM levels l WHERE l.level_number = 3;

-- Level 3 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'For a /24 network, determine the network address, broadcast address, and usable host range first.', 1, true
FROM levels l WHERE l.level_number = 3;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, '.0 is the network identifier, .255 is the broadcast address, and .27 is already in use.', 2, true
FROM levels l WHERE l.level_number = 3;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Select the unused host IP address that falls between .1 and .254.', 3, true
FROM levels l WHERE l.level_number = 3;

-- Level 4 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Both conditions must be true simultaneously for a selected student.', 1, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Consider whether the boolean operator connecting department and marks should be AND or OR.', 2, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Look for the query requiring department = ''CSE'' AND marks > 80.', 3, true
FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Think about the difference between successful response, redirect, missing resource, and server failure.', 1, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, '200 is OK, 301 is Moved Permanently, 500 is Internal Server Error.', 2, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'What standard 4xx client-error status code signifies "Not Found"?', 3, true
FROM levels l WHERE l.level_number = 4;

-- Level 4 Stage 3
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Think about the difference between staging a specific file and staging all files.', 1, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'git add . stages all modified files, including index.html and style.css.', 2, true
FROM levels l WHERE l.level_number = 4;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'The command sequence must explicitly stage only app.js before committing.', 3, true
FROM levels l WHERE l.level_number = 4;

-- Level 5 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Ask whether the original data needs to be recovered or decrypted.', 1, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Encryption is two-way (requires decryption). The requirement specifies a one-way transformation.', 2, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Which mechanism transforms an arbitrary string into a fixed-length digest that cannot be reversed?', 3, true
FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Authentication asks "Who are you?" Think about the next question: "What are you allowed to do?"', 1, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'The user identity is verified through login. The failure occurs due to lack of permission.', 2, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Access control and permission checks represent which security principle?', 3, true
FROM levels l WHERE l.level_number = 5;

-- Level 5 Stage 3
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Convert each 8-bit group to decimal first, then look up the corresponding ASCII character.', 1, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, '01001000 in decimal = 64 + 8 = 72. 01001001 in decimal = 64 + 8 + 1 = 73.', 2, true
FROM levels l WHERE l.level_number = 5;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'In ASCII, decimal 72 is ''H'' and decimal 73 is ''I''. Combine them.', 3, true
FROM levels l WHERE l.level_number = 5;

-- Level 6 Stage 1
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'The reference type and the actual runtime object type are not necessarily the same.', 1, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'In Java, method calls on objects are polymorphic and dynamically dispatched at runtime.', 2, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 1, 'Even though x is declared as Animal, the underlying instance is a Dog. Which speak() method executes?', 3, true
FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 2
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'The left side represents the host port. The right side represents the container port.', 1, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'Users connect to the host on port 3000. The internal application listens on port 8080.', 2, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 2, 'The standard syntax is -p HOST:CONTAINER, so host port 3000 maps to container port 8080.', 3, true
FROM levels l WHERE l.level_number = 6;

-- Level 6 Stage 3
INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Start with the fixed facts: Java = Monday, Python = Tuesday, B = Thursday. Then use the ordering clues.', 1, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Since Java is Monday and Python is Tuesday, C (who does SQL) must work on Wednesday, because C works before B (Thursday).', 2, true
FROM levels l WHERE l.level_number = 6;

INSERT INTO hints (level_id, stage_number, hint_content, display_order, is_active)
SELECT l.id, 3, 'Networks works after C (Wednesday), so Networks must be on Thursday. Who works on Thursday?', 3, true
FROM levels l WHERE l.level_number = 6;
