# CodeXcape — Hard Cooperative Technical Questions & Puzzles
## Version 5.0 — Hard-to-Very-Hard Asymmetric Cooperative Puzzle Set

## Core Gameplay
Every stage is a two-player cooperative technical puzzle.

- Player 1 receives Information A.
- Player 2 receives Information B.
- A alone must be insufficient.
- B alone must be insufficient.
- Players must communicate and combine A + B.
- The team submits one answer.
- Progression is team-based.
- Neither player may receive the other player's information through UI, API, storage, source code, WebSocket payloads, or hidden DOM.

## Difficulty Progression

| Level | Stages | Target |
|---|---:|---|
| Level 1 | 2 | Hard |
| Level 2 | 2 | Hard+ |
| Level 3 | 2 | Very Hard |
| Level 4 | 3 | Very Hard+ |
| Level 5 | 3 | Expert |
| Level 6 | 3 | Expert / Final Escape |

Total: **15 stages**. Game time: **100 minutes**. Story sequences pause the competitive timer.

---

# LEVEL 1 — SYSTEM AWAKENING

## Stage 1 — Corrupted Execution Trace
**Topics:** Programming Fundamentals / Loops / Conditionals / State Tracking

### Shared Mission
ARIA recovered a corrupted execution trace. Reconstruct the final state.

### Player 1 receives
```text
Initial state:
x = 7
y = 3

The process performs exactly 6 iterations.

At iteration i:
1. x = x + (i × 2)
2. If x is divisible by 3:
      x = x / 3
   Otherwise:
      x = x + 1
```

### Player 2 receives
```text
After Player 1's transformation:

If x is even:
    y = y + x / 2

If x is odd:
    y = y - i

The next iteration starts with the resulting x and y.
Record i, x, y after every iteration.
```

### Team Challenge
**Determine the final values of x and y after iteration 6.**

### Hints
1. Every iteration depends on the previous state.
2. Test divisibility after the addition.
3. Build one shared table: `i | x | y`.

---

## Stage 2 — Python Trace Reconstruction
**Topics:** Python / Lists / Functions / Slicing / Mutation / Output Prediction

### Shared Mission
A Python recovery script is split across two diagnostic terminals. Determine the exact final list.

### Player 1 receives
```python
data = [4, 7, 2, 9, 5, 8]

a = data[1:5]
a.reverse()

for i in range(len(a)):
    a[i] = a[i] - i
```

### Player 2 receives
```text
After the loop:

b = data[::2]
b.append(a[1])
data[2] = b[-1]
print(data)

Rules:
- data[1:5] creates a new list.
- reverse() changes a, not data.
- data[::2] creates a new list.
- data[2] changes the original data.
```

### Team Challenge
**What exact list is printed?**

### Hints
1. Keep `data`, `a`, and `b` separate.
2. Slices create new lists here.
3. Trace the mutation of `data[2]`.

---

# LEVEL 2 — THE LOCKED ARCHIVE

## Stage 3 — Stack + Queue Transmission
**Topics:** Data Structures / Stack / Queue / LIFO / FIFO

### Player 1 receives
```text
Stack S starts empty.

PUSH 4
PUSH 9
PUSH 2
POP → move removed value into Queue Q
PUSH 7
POP → move removed value into Queue Q

Queue Q starts empty.
Stack uses LIFO.
```

### Player 2 receives
```text
Continue:

PUSH 5 into S
POP from S → move to Q

Remove the front value from Q.
PUSH that removed value into S.

PUSH 8 into S
POP from S → move to Q

Queue uses FIFO.

Determine Q from front to back.
```

### Team Challenge
**What is the final queue order?**

### Hints
1. Track S from bottom to top.
2. Track Q from front to back.
3. The temporary Q → S transfer changes later order.

---

## Stage 4 — Binary Search Interrogation
**Topics:** Algorithms / Binary Search / Big-O / Tracing

### Player 1 receives
```text
Sorted identifiers:

11, 18, 24, 31, 39, 47, 55, 63,
72, 81, 90, 101, 115, 129, 144

Recorded binary-search midpoint values:
72
39
55
63
```

### Player 2 receives
```text
Binary search:
- Start with the complete sorted range.
- Select the middle element.
- If target < midpoint, use lower half.
- If target > midpoint, use upper half.
- If equal, search ends.

The recorded sequence contains every comparison until the target.
Also determine worst-case time complexity.
```

### Team Challenge
**Identify the target and state the worst-case Big-O complexity.**

### Hints
1. Start at 72.
2. Narrow the interval after every comparison.
3. The final recorded midpoint is the target.

---

# LEVEL 3 — NETWORK SHADOW

## Stage 5 — Packet Path Reconstruction
**Topics:** Networking / Routing / TCP / UDP / Ports

### Player 1 receives
```text
Source: 10.0.2.15
Destination: 10.0.5.20

Observed hops:
10.0.2.1
10.0.3.1
10.0.5.1

Destination is reached after the third router.
Application requires reliable delivery.
```

### Player 2 receives
```text
Routing:
10.0.2.1 → forwards 10.0.3.0/24
10.0.3.1 → forwards 10.0.5.0/24
10.0.5.1 → forwards to local destination

Destination port = 443

TCP: reliable, ordered delivery, retransmission
UDP: lower overhead, no delivery guarantee

Choose protocol according to the application requirement.
```

### Team Challenge
**Give the complete packet route and transport protocol.**

### Answer format
`SOURCE → HOP 1 → HOP 2 → HOP 3 → DESTINATION | PROTOCOL`

### Hints
1. Match forwarding networks to the destination.
2. Port 443 alone does not determine the transport protocol.
3. Use the reliability requirement.

---

## Stage 6 — Subnet Forensics
**Topics:** IPv4 / CIDR / Subnetting / Host Range

### Player 1 receives
```text
Network:
172.16.40.64/27

Observed:
172.16.40.65
172.16.40.78
172.16.40.94
172.16.40.97
```

### Player 2 receives
```text
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
D. Outside subnet
```

### Team Challenge
**Determine the usable range and classify 172.16.40.94.**

### Hints
1. A /27 block contains 32 addresses.
2. Start at .64.
3. Check the two boundaries before classifying the candidate.

---

# LEVEL 4 — CORE SYSTEM BREACH

## Stage 7 — SQL Evidence Merge
**Topics:** DBMS / SQL / JOIN / GROUP BY / HAVING

### Player 1 receives
```text
students
student_id | name | department
101 | Asha   | CSE
102 | Bala   | ECE
103 | Chitra | CSE
104 | Dev    | IT

marks
student_id | subject | mark
101 | DBMS | 88
101 | OS   | 91
103 | DBMS | 84
103 | OS   | 79
104 | DBMS | 92

Requirement:
Find CSE students whose average recorded mark is > 80.
```

### Player 2 receives
```text
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
HAVING ...
```

### Team Challenge
**Construct the SQL query that returns the qualifying CSE students.**

### Hints
1. Determine the JOIN condition first.
2. Filter department before grouping.
3. Average is an aggregate condition.

---

## Stage 8 — Web Request Autopsy
**Topics:** HTTP / Web Development / Status Codes / Debugging

### Player 1 receives
```text
Request:
POST /api/profile

Payload:
{"name":"Asha"}

Server:
- route exists
- request reached application
- body is valid
- authenticated user is known
- unexpected database failure occurs while writing the profile
```

### Player 2 receives
```text
200 = success
201 = created
400 = invalid request
401 = authentication failure
403 = authenticated but forbidden
404 = resource not found
500 = unexpected server-side failure

The operation is a profile update.
```

### Team Challenge
**Choose the correct HTTP status and explain why the strongest alternatives do not apply.**

### Hints
1. The route exists.
2. Authentication succeeded.
3. The failure occurs during server-side processing.

---

## Stage 9 — Git Branch Collision
**Topics:** Git / Branches / Merge / Conflicts

### Player 1 receives
```text
main originally:
const mode = "production";

feature was created from that version and changed it to:
const mode = "debug";

Feature change was committed.
```

### Player 2 receives
```text
Later, main independently changed the same line to:
const mode = "safe";

Then:
git checkout main
git merge feature

Git reports a conflict in app.js.

A. Resolve conflict, stage file, complete merge commit
B. Delete repository
C. Clone again
D. Push without resolving
```

### Team Challenge
**Choose the required action and explain why Git cannot merge automatically.**

### Hints
1. Compare the common ancestor and both branch versions.
2. The same line was changed independently.
3. The conflict must be resolved before the merge completes.

---

# LEVEL 5 — ENCRYPTED MEMORY

## Stage 10 — Multi-Layer Encoding Forensics
**Topics:** Cryptography / Hex / ASCII / Base64

### Player 1 receives
```text
Recovered fragment:

53 47 56 73 62 47 38 3d

These are hexadecimal representations of ASCII characters.
Convert hex → ASCII first.
```

### Player 2 receives
```text
The resulting ASCII string is Base64.

Procedure:
1. Hex → ASCII
2. Treat resulting text as Base64
3. Base64 decode
4. Interpret resulting bytes as ASCII
```

### Team Challenge
**What readable message is recovered after both transformations?**

### Hints
1. 53, 47, etc. are hex byte values.
2. The intermediate string uses Base64.
3. Order matters.

---

## Stage 11 — Security Incident Correlation
**Topics:** Cybersecurity / Authentication / Authorization

### Player 1 receives
```text
09:14 — Ravi logs in successfully.
09:15 — Ravi requests /admin/reports.
09:15 — Server identifies Ravi as authenticated.
09:15 — Request rejected because Ravi lacks admin privileges.
09:17 — Another Ravi login attempt fails due to wrong password.
```

### Player 2 receives
```text
Authentication = verifies identity.
Authorization = determines permitted access.
Hashing = one-way password representation.

There are two different security events.
Identify the security control involved in the 09:15 event.
```

### Team Challenge
**Identify the control responsible for rejecting /admin/reports and distinguish it from the 09:17 event.**

### Hints
1. The 09:15 event happens after successful authentication.
2. Separate identity verification from permission checking.

---

## Stage 12 — Cipher Chain
**Topics:** Cryptography / Caesar Cipher / ASCII

### Player 1 receives
```text
ASCII decimal sequence:

75 72 78 78 82

Convert decimal → uppercase ASCII characters first.
```

### Player 2 receives
```text
The resulting uppercase text was encrypted using Caesar +3.

Decrypt by shifting each alphabetic character backward by 3.
Preserve order.
```

### Team Challenge
**Decode the original message.**

### Hints
1. Do not Caesar-shift the decimal numbers.
2. Convert to characters first.
3. Decryption reverses the +3 shift.

---

# LEVEL 6 — NODE ZERO

## Stage 13 — Java Polymorphism Trace
**Topics:** Java / OOP / Inheritance / Overriding / Runtime Polymorphism

### Player 1 receives
```java
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
}
```

### Player 2 receives
```java
A first = new C();
B second = new C();

first.show();
second.show();
second.extra();
```

Concepts:
- Reference type controls accessible members.
- Runtime polymorphism selects the overridden method.
- C inherits B.extra() because C does not override it.
```

### Team Challenge
**What exact sequence is printed?**

### Hints
1. For show(), inspect the object created by new.
2. For extra(), inspect inheritance.
3. Do not confuse reference type with runtime object type.

---

## Stage 14 — Docker Deployment Failure
**Topics:** Docker / Containers / Ports / Debugging

### Player 1 receives
```text
Application listens inside container on:
0.0.0.0:8080

Inside container:
curl http://localhost:8080
works.

Host requirement:
http://localhost:3000
```

### Player 2 receives
```text
Current command:
docker run -p 8080:3000 app

Docker format:
HOST_PORT:CONTAINER_PORT

Candidates:
A. -p 3000:8080
B. -p 8080:3000
C. -p 3000:3000
D. no port mapping
```

### Team Challenge
**Give the correct mapping and explain the failure in the current mapping.**

### Hints
1. Read HOST:CONTAINER.
2. The application listens internally on 8080.
3. The user must reach it externally through 3000.

---

## Stage 15 — NODE ZERO: Final Distributed Logic Breach
**Topics:** Logic / Programming / Networks / Databases / Multi-Step Deduction

### Shared Mission
Four engineers each have one specialty, one day, and one system responsibility. No value repeats.

### Player 1 receives
```text
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
6. Dev is C++ specialist.
```

### Player 2 receives
```text
7. Security engineer works Wednesday.
8. Bala works before the Java specialist.
9. SQL specialist is responsible for Database.
10. Chitra is not Security.
11. Python specialist works Tuesday.
12. Dev does not work Thursday.

Determine the engineer responsible for Networks.
```

### Team Challenge
**Who is responsible for Networks?**

### Hints
1. Start with fixed relationships.
2. Connect specialty to responsibility.
3. Use day constraints to eliminate combinations.
4. Build one complete grid: Engineer × Specialty × Day × Responsibility.

---

# Difficulty Verification

| Stage | Reasoning | Cooperation | Difficulty |
|---|---|---|---|
| L1S1 | State simulation | High | Hard |
| L1S2 | Python tracing/mutation | High | Hard |
| L2S1 | Stack + queue simulation | High | Hard+ |
| L2S2 | Search reconstruction | High | Hard+ |
| L3S1 | Routing + protocol | High | Very Hard |
| L3S2 | CIDR calculation | High | Very Hard |
| L4S1 | JOIN + aggregation | Very High | Very Hard+ |
| L4S2 | Incident reasoning | High | Very Hard+ |
| L4S3 | Branch history analysis | High | Very Hard+ |
| L5S1 | Multi-layer decoding | Very High | Expert |
| L5S2 | Security correlation | Very High | Expert |
| L5S3 | Multi-step cipher | Very High | Expert |
| L6S1 | Runtime polymorphism | Very High | Expert |
| L6S2 | Container networking/debugging | Very High | Expert |
| L6S3 | Multi-dimensional deduction | Extreme | Expert / Final |

# Mandatory Cooperative Integrity Test

Every stage must satisfy:

**Player 1 alone:** cannot uniquely solve.

**Player 2 alone:** cannot uniquely solve.

**Player 1 + Player 2:** sufficient information to solve through reasoning.

Difficulty must come from technical reasoning, not confusing wording.

# Anti-Spoiler Rules

Never expose:
- final answers
- accepted-answer arrays
- solution paths
- complete combined clues
- the other player's clues
- hidden validation values
- expected intermediate values
- solution explanations

Do not use CSS hiding, HTML comments, disabled controls, JavaScript variables, Base64, minification, or client-side obfuscation as security.

# Hint Rules

Hints may explain concepts, terminology, syntax, or useful representations.

Hints must never reveal:
- final answer
- teammate information
- complete intermediate calculation
- complete solution path

# Final Design Principle

> **“I have information you don't have. You have information I don't have. Neither of us can escape alone.”**

The puzzles must become substantially more demanding from Level 1 through Level 6.
