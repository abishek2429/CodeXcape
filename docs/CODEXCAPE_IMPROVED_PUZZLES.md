# CodeXcape — Improved Puzzle Questions & Player Guidance

This document provides enhanced puzzle telemetry with clearer clue structure, better hint pathways, and reduced ambiguity.

---

## Level 1: System Reconstruction

### Stage 1: Log Collision — IMPROVED

**Narrative:** A system incident has left fragmented logs across multiple streams. One process misbehaved—it changed state twice in an unusual way. Find the anomaly.

#### Player 1 Telemetry (Operator View — Log Streams):

```text
INCIDENT WINDOW: 08:13:58 to 08:14:27 (29 seconds)
Three log streams captured during the incident.

LOG STREAM A (HIGH-PRIORITY LOGS):
08:14:02  process=relay   pid=17  status=READY    channel=K
08:14:11  process=watcher pid=04  status=REJECTED channel=K
08:14:19  process=relay   pid=17  status=RETRY    channel=K  ← NOTE: Same process (relay) at different times!
08:14:27  process=archive pid=88  status=READ     channel=R

LOG STREAM B (SECONDARY LOGS):
08:13:58  process=archive pid=88  status=READ     channel=R
08:14:11  process=watcher pid=04  status=REJECTED channel=K

OUTSIDE THE INCIDENT WINDOW (Ignore these):
09:02:44  process=backup  pid=99  status=COMPLETE channel=R  ← Backup runs at 9:02 AM (different time!)

CLUE FOR PLAYER 1:
Find the ONE process that changed state twice during the incident window (08:13:58–08:14:27).
Record its channel assignment AND the unique identifier (PID) for that process.
Answer format hint: [CHANNEL]-[PID]
```

#### Player 2 Telemetry (Analyzer View — System Map):

```text
SYSTEM ARCHITECTURE MAP
This shows which process owns which communication channel:

PROCESS → CHANNEL MAPPING:
- relay (pid=17):   owns channel K (active transaction pipeline — handles real-time data)
- watcher (pid=04): monitors channel K (observer-only, does NOT own channel K)
- archive (pid=88): owns channel R (storage volume — handles stored data)

VERIFICATION RULES:
1. Only ONE process can "own" a channel.
2. The watcher process only observes; it doesn't own anything.
3. When a process is marked REJECTED, it still belongs to its assigned channel.
4. When a process is marked RETRY, it indicates abnormal behavior.

CLUE FOR PLAYER 2:
Player 1 will find ONE process that changed state twice during the incident.
Your job: Confirm which CHANNEL that process owns, and verify the PID matches.

What is the channel assignment of the process that changed state twice?
What is that process's PID?
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What is the system trace label for the anomalous process?"

The trace label combines:
- The channel that the misbehaving process owns
- The unique PID identifier of that process

Answer format: SYSTEM TRACE: [CHANNEL]-[PID]

Example (not the answer): If a process called "transmit" with pid=42 owned channel X,
the answer would be: SYSTEM TRACE: X-42
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Look for a process that appears MORE THAN ONCE in the incident window
2. Log times: 08:14:02 (relay), 08:14:11 (watcher), 08:14:19 (relay), 08:14:27 (archive)
3. Which appears twice? → RELAY at 08:14:02 AND 08:14:19
4. RELAY changed state: READY → RETRY (abnormal!)
5. RELAY has pid=17

PLAYER 2 REASONING:
1. From architecture map: relay owns channel K
2. Watcher and archive own different channels
3. RELAY = channel K

CROSS-REFERENCE:
P1: "I found relay (pid=17) changed state twice"
P2: "relay owns channel K"
BOTH SUBMIT: SYSTEM TRACE: K-17
```

---

### Stage 2: Access Panel — IMPROVED

**Narrative:** The anomalous process is tied to a physical access panel. Three security controls must be engaged simultaneously: the correct NODE, the correct PROCESS, and the correct SEQUENCE code. Get all three right or nothing opens.

#### Player 1 Telemetry (Operator View — Control Panel):

```text
ACCESS PANEL INTERFACE
Three selector knobs on the physical panel:

KNOB 1: NODE SELECTOR
Available options: [N-2] [N-4] [N-7]
Current position: UNKNOWN

KNOB 2: PROCESS SELECTOR
Available options: [relay] [watcher] [archive]
Current position: UNKNOWN

KNOB 3: SEQUENCE SELECTOR
Available options: [K-17] [R-03] [M-22]
Current position: UNKNOWN

INSTRUCTIONS FROM SECURITY LOG:
"The panel activation requires selecting the node infrastructure, the process responsible for the incident,
and the system trace from Stage 1."

CLUES FOR PLAYER 1:
You already know:
- The anomalous process name (from Stage 1)
- The trace code (from Stage 1)

You need Player 2 to find:
- Which node the channel is hosted on
```

#### Player 2 Telemetry (Analyzer View — Infrastructure Map):

```text
NODE INFRASTRUCTURE MAP
This shows which communication channels run on which physical nodes:

INFRASTRUCTURE LAYOUT:
┌─────────────────────────────────────────────┐
│ NODE N-2:  hosts channel M                  │
│ NODE N-4:  hosts channel K  ← Current focus │
│ NODE N-7:  hosts channel R                  │
└─────────────────────────────────────────────┘

VERIFICATION MATRIX:
To unlock the access panel, the system requires:
1. The NODE that hosts the channel from Stage 1
2. The PROCESS that exhibited abnormal behavior (Stage 1)
3. The SYSTEM TRACE code (already solved in Stage 1)

CLUE FOR PLAYER 2:
Player 1 has the process name and trace code.
Your job: Find which NODE hosts the channel that the anomalous process owns.

Example: If the trace code was "K-17", which node hosts channel K?
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"Configure the access panel with all three controls set correctly."

You must determine:
1. NODE: Which physical node hosts the channel?
2. PROCESS: Which process caused the incident?
3. SEQUENCE: What is the system trace code?

Answer: RECOVERY FRAGMENT 01

(This confirms all three settings are correct: NODE + PROCESS + SEQUENCE match)
```

#### Solution Path:

```
PLAYER 1 THINKS:
1. From Stage 1, I found: relay (pid=17) and channel K
2. Trace code: K-17
3. The process selector should be: relay
4. The sequence selector should be: K-17
5. I still need the NODE from Player 2

PLAYER 2 THINKS:
1. From the infrastructure map: Channel K runs on Node N-4
2. The node selector should be: N-4

CROSS-REFERENCE:
P1: "Process = relay, Sequence = K-17"
P2: "Node = N-4"
BOTH SUBMIT: RECOVERY FRAGMENT 01
```

---

## Level 2: Data Vault

### Stage 1: Fragment Vault — IMPROVED

**Narrative:** A data structure has been shattered into fragments. Each fragment is identified by a code (like B7, 41, C3). The fragments can only connect at their boundaries, marked by special hex delimiters. Find the correct chain and identify the transformation method.

#### Player 1 Telemetry (Operator View — Raw Fragments):

```text
DATA RECOVERY: FRAGMENT INSPECTION
You have raw hex-encoded fragments. Each has boundary markers.

AVAILABLE FRAGMENTS:

Fragment B7:
  Content: [hex bytes here]
  Boundary marker at END: 2F
  Status: Linked to another fragment (chain continues)

Fragment 41:
  Content: [hex bytes here]
  Boundary marker at START: 7B
  Status: Linked to another fragment (chain continues)

Fragment C3:
  Content: [hex bytes here]
  Boundary marker at END: 2F (same type as B7)
  Status: Part of a chain

Fragment 99 (SUSPICIOUS):
  Content: [corrupted hex]
  Boundary marker checksum: INVALID ← DO NOT USE
  Status: Damaged / Decoy

CLUES FOR PLAYER 1:
- Some fragments are valid; some are decoys
- Boundary markers (2F, 7B) show how fragments link together
- Fragment B7 ends with 2F
- Fragment 41 starts with 7B
- Fragment 99 has a broken checksum (ignore it!)
- Fragment C3 ends with 2F

Your job: Which fragments form a valid chain?
Hint: Try linking B7 and 41 by their boundary markers.
```

#### Player 2 Telemetry (Analyzer View — Chain Verification):

```text
FRAGMENT CHAIN ANALYSIS
This shows the correct order in which fragments should connect.

BOUNDARY CHAIN VALIDATION:

The correct fragment order is: [C3] → [B7] → [41]

Why this order?
- C3 ends with boundary marker 2F (can link forward)
- B7 starts and ends with boundary markers (can link both ways)
- 41 starts with boundary marker 7B (can link backward)
- The boundary markers align: 2F (C3 end) matches 2F (B7 end) matches 7B (41 start)
- The checksum validates ONLY after the complete chain [C3][B7][41]

DECOY ANALYSIS:

Fragment D0:
  Status: Orphan fragment (no boundary match with other fragments)
  Reason: Its markers don't connect to C3, B7, or 41
  Action: IGNORE

Fragment 99:
  Status: Corrupted (checksum is invalid)
  Reason: The boundary marker is damaged
  Action: IGNORE

CLUES FOR PLAYER 2:
- Only 3 fragments form the valid chain
- Player 1 can identify which fragments have valid boundary markers
- You can verify the chain order using the boundary validation rules
- The data type of the fragments (hexadecimal pairs) will be important for Stage 2

Your job: Confirm which 3 fragments form the complete chain in the correct order.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What transformation method will convert the fragment chain into readable data?"

Possible answers (not all correct):
- HEX-TO-TEXT (hex bytes → ASCII text)
- BINARY-FLIP (binary inversion)
- CIPHER-DECODE (cryptographic decryption)
- ASCII-TO-HEX (reverse process)

Answer: HEX-TO-TEXT

This tells the system: "These hex-encoded fragments need to be converted to readable text format."
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. B7 ends with 2F (can link)
2. 41 starts with 7B (can link)
3. C3 ends with 2F (can link)
4. 99 has INVALID checksum (skip!)
5. D0 has no matching boundary (skip!)
6. Valid fragments: B7, 41, C3

PLAYER 2 REASONING:
1. The boundary chain is: C3 → B7 → 41
2. This is the only valid ordering
3. After linking all 3, checksum validates

CROSS-REFERENCE:
P1: "I found 3 fragments: B7, 41, C3"
P2: "The order is C3 → B7 → 41, and they're hexadecimal"
BOTH SUBMIT: HEX-TO-TEXT
```

---

### Stage 2: Transformation Chamber — IMPROVED

**Narrative:** The hex-encoded fragment chain must be converted to readable text. But first, someone encrypted it with a shift cipher. Player 1 must identify the shift; Player 2 must verify the decryption makes sense. Both must agree on the recovery fragment name.

#### Player 1 Telemetry (Operator View — Transformation Engines):

```text
TRANSFORMATION CHAMBER
Available hex data: 52 45 43 4F 56 45 52 59

DECRYPTION METHODS AVAILABLE:

Method A: CAESAR SHIFT
  - Apply: Shift each decoded ASCII character by N positions
  - Options: Try shifts 0, 1, 2, 3, ... 25 (standard Caesar)
  - Purpose: Reverse the encryption that was applied to the original message

Method B: ASCII-TO-WORDS
  - Apply: Convert hex bytes directly to ASCII without any shift
  - Options: Use as-is (no parameter)
  - Purpose: If data was NOT encrypted, just decode hex → ASCII

TASK FOR PLAYER 1:
1. Decode the hex to ASCII: 52 45 43 4F 56 45 52 59
   (Hex 52 = ASCII 'R', Hex 45 = ASCII 'E', etc.)
2. You should get: R E C O V E R Y (unshifted)
3. But the message might be encrypted! Try applying Caesar shifts (shift by 1, 2, 3, etc.)
4. Look for a plaintext that makes sense
5. Tell Player 2 which method (Caesar shift or plain ASCII) you used

HINT:
The recovered message should be readable English or technical terms.
If you see gibberish, try a different shift.
```

#### Player 2 Telemetry (Analyzer View — Decryption Validation):

```text
DECRYPTION VALIDATION MATRIX

You have the decrypted hex: 52 45 43 4F 56 45 52 59

DECRYPTION RULES:

If Player 1 uses ASCII-TO-WORDS (no shift):
  Hex 52 → 'R'
  Hex 45 → 'E'
  Hex 43 → 'C'
  Hex 4F → 'O'
  Hex 56 → 'V'
  Hex 45 → 'E'
  Hex 52 → 'R'
  Hex 59 → 'Y'
  Result: RECOVERY (makes sense!)

If Player 1 uses CAESAR SHIFT (shift by N):
  Apply reverse-shift to each letter
  Example: RECOVERY shifted by 1 = SFDUFSZ (doesn't make sense)
  Example: RECOVERY shifted by 0 = RECOVERY (makes sense!)

TASK FOR PLAYER 2:
1. Decode the hex yourself: 52 45 43 4F 56 45 52 59
2. What plain English word do you get?
3. Does applying any Caesar shift improve readability?
4. Tell Player 1 if the decoding is correct

HINT:
The decoded message should be a single readable word or phrase.
If it's not readable English, Player 1 may have used the wrong transformation method.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What recovery fragment name does this decrypted data represent?"

The decoded text spells: RECOVERY

This is the name of the data fragment recovered from the vault.
Fragments are numbered sequentially: RECOVERY FRAGMENT 01, 02, 03, etc.

Since this is the SECOND stage of Level 2, it's the SECOND recovery fragment.

Answer: RECOVERY FRAGMENT 02

(Both players must independently verify the decryption and agree on this answer.)
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Hex stream: 52 45 43 4F 56 45 52 59
2. Decode hex to ASCII: R E C O V E R Y
3. Try Caesar shifts: shift by 0 (no shift) → RECOVERY (readable!)
4. No need for Caesar shift; ASCII-to-Words works

PLAYER 2 REASONING:
1. Hex stream: 52 45 43 4F 56 45 52 59
2. Decode hex to ASCII: R E C O V E R Y
3. This is a real English word
4. No Caesar shift needed

CROSS-REFERENCE:
P1: "I decoded with ASCII-TO-WORDS, got RECOVERY"
P2: "I decoded and got RECOVERY, plaintext makes sense"
BOTH SUBMIT: RECOVERY FRAGMENT 02
```

---

## Level 3: Network Incident

### Stage 1: Network Reconstruction — IMPROVED

**Narrative:** A network topology has been partially destroyed. You have a fragmented map of nodes and connections. One route stands out because both players can independently verify it makes sense.

#### Player 1 Telemetry (Operator View — Ingress Logs):

```text
NETWORK INCIDENT: INGRESS ANALYSIS
Incoming traffic patterns show which nodes were communicating.

INGRESS TRAFFIC RECORDS:

Entry 1: Traffic FROM external_source TO node_A (timestamp 10:15:02)
Entry 2: Traffic FROM node_A TO node_B (timestamp 10:15:05)
Entry 3: Traffic FROM node_B TO node_C (timestamp 10:15:08)
Entry 4: Traffic FROM node_C TO sink (timestamp 10:15:11)

ANOMALY DETECTED:
A path was established: [external] → A → B → C → [sink]
This shows clear SEQUENTIAL ROUTING.

DECOY TRAFFIC:
Entry 5: Traffic FROM external_source TO node_C (timestamp 10:15:03, anomalous jump)
  → This is OUT OF SEQUENCE (should follow A, not jump directly)
  → Ignore this for the main route

CLUE FOR PLAYER 1:
Find the nodes in the order that traffic flowed through them.
The sequence follows a clear pattern from start to end.
Answer format hint: ROUTE [NODE]-[NODE]-[NODE]
```

#### Player 2 Telemetry (Analyzer View — Network Map):

```text
NETWORK TOPOLOGY MAP
This shows which nodes are connected to which.

CONNECTION TOPOLOGY:

Node A connects to: [B, D, Z]
Node B connects to: [A, C, E]
Node C connects to: [B, F, sink]
Node D connects to: [A, E]
Node E connects to: [B, D, F]
Node F connects to: [C, E]

VALID ROUTE VERIFICATION:
A route is valid if each consecutive node pair is connected in the topology.

Examples:
- Route A → B → C: Is A↔B connected? YES. Is B↔C connected? YES. ✓ VALID
- Route A → E → C: Is A↔E connected? NO. ✗ INVALID
- Route A → B → F: Is A↔B connected? YES. Is B↔F connected? NO. ✗ INVALID

CLUE FOR PLAYER 2:
Player 1 will propose a sequence of nodes.
Your job: Verify that each consecutive pair is actually connected in the topology.
Use the connection topology to confirm.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What is the routing path established during the incident?"

The route shows nodes in sequence, separated by dashes.

Answer format: ROUTE [NODE1]-[NODE2]-[NODE3]

Example (not the answer): ROUTE A-D-E
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Traffic ingress logs show sequential path: A → B → C
2. Entry 1: traffic to A
3. Entry 2: traffic from A to B
4. Entry 3: traffic from B to C
5. Entry 4: traffic from C to sink
6. The main route is A-B-C (ignoring the decoy anomalous entry 5)

PLAYER 2 REASONING:
1. Is A connected to B? YES (Node A connects to [B, D, Z])
2. Is B connected to C? YES (Node B connects to [A, C, E])
3. This route is valid

CROSS-REFERENCE:
P1: "The ingress sequence is A → B → C"
P2: "Topology confirms A↔B and B↔C are connected"
BOTH SUBMIT: ROUTE A-B-C
```

---

### Stage 2: Trace The Connection — IMPROVED

**Narrative:** A packet traveled through the network. To find the exact path, you need to trace its journey using both the packet log and the network topology.

#### Player 1 Telemetry (Operator View — Packet Log):

```text
PACKET FORENSICS: TRACE LOG
A packet was captured at multiple checkpoints along its journey.

PACKET CAPTURE LOG:

Checkpoint 1 (Source): packet enters at node_C
Checkpoint 2: packet passes through node_E
Checkpoint 3 (Destination): packet exits at node_unknown

PACKET SEQUENCE:
C → E → [unknown]

CLUE FOR PLAYER 1:
The packet traveled through C and then E.
You need Player 2 to identify which node comes after E in the valid network path.
```

#### Player 2 Telemetry (Analyzer View — Topology Verification):

```text
NETWORK TOPOLOGY (same as Stage 1):

Node C connects to: [B, F, sink]
Node E connects to: [B, D, F]

PATH CONTINUATION ANALYSIS:
The packet path so far: C → E → ?

From E, where can it go?
- E connects to: [B, D, F]
- It arrived FROM C, so backtracking to B is possible
- It could go to D (new node)
- It could go to F (new node)

BUT: Which is most likely based on network flow patterns?

Since the packet arrived at C from somewhere, and then went to E,
the most logical next hop from E should be a node not yet visited (unless looping).

Natural continuation: E → F (completes a diverse path)

CLUE FOR PLAYER 2:
Player 1 knows the packet was at C, then E.
Verify: From E, which connected node makes sense as the next hop?
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"Trace the complete packet path through the network."

You know the first two nodes: C and E.
Find the third node where the packet exits.

Answer format: PACKET PATH C-E-[NODE]

Hint: The third node should be connected to E.
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Packet log: C → E → ?
2. I don't know which node is after E
3. I need Player 2 to check the topology

PLAYER 2 REASONING:
1. Node E connects to: [B, D, F]
2. The packet came from C (already visited)
3. Most likely next node: F (hasn't been visited yet in this path)
4. Verify: Is E connected to F? YES

CROSS-REFERENCE:
P1: "Packet goes C → E → ?"
P2: "From E, the next node should be F (topology confirms E↔F)"
BOTH SUBMIT: PACKET PATH C-E-F
```

---

### Stage 3: Packet Recovery — IMPROVED

**Narrative:** A packet was split into fragments. Some fragments arrived; some were lost in transit. By analyzing the packet header and comparing what should have arrived versus what did, you can identify the dropped fragment.

#### Player 1 Telemetry (Operator View — Packet Fragments):

```text
PACKET REASSEMBLY: FRAGMENT CAPTURE
A packet was split into 4 fragments for transmission.
However, one fragment was dropped during network transit.

RECEIVED FRAGMENTS:

Fragment 1 (received): timestamp 10:02:01, sequence=1
Fragment 2 (received): timestamp 10:02:03, sequence=2
Fragment 4 (received): timestamp 10:02:07, sequence=4
Fragment ? (MISSING!):  should have arrived between Fragment 2 and Fragment 4

ANALYSIS:
- Fragment 1 and 2 arrived successfully
- Fragment 4 arrived successfully
- Fragment 3 is missing

CLUE FOR PLAYER 1:
By comparing the sequence numbers, you can see a gap.
The packet header indicates 4 total fragments should exist (fragments 1, 2, 3, 4).
Fragments 1, 2, and 4 arrived.
Therefore, Fragment 3 was dropped.

Your job: Identify which fragment number is missing.
```

#### Player 2 Telemetry (Analyzer View — Expected Packet Structure):

```text
PACKET STRUCTURE VERIFICATION

The packet header defines the packet structure:

PACKET HEADER INFO:
- Packet ID: PACKET_3
- Total fragments: 4
- Fragment sequence: [1, 2, 3, 4]
- Expected timestamp range: 10:02:00 to 10:02:15

RECEIVED FRAGMENTS SUMMARY:
Fragment 1: ✓ Received (10:02:01)
Fragment 2: ✓ Received (10:02:03)
Fragment 3: ✗ NOT Received
Fragment 4: ✓ Received (10:02:07)

MISSING FRAGMENT ANALYSIS:
The gap between Fragment 2 (10:02:03) and Fragment 4 (10:02:07)
indicates that Fragment 3 was expected but never arrived.

CLUE FOR PLAYER 2:
By comparing the packet header (4 total fragments) with received fragments (1, 2, 4),
you can confirm which fragment number is missing.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"Which packet fragment was dropped during transmission?"

You should identify both:
1. The fragment NUMBER that is missing (e.g., Fragment 3)
2. This becomes part of your recovery fragment ID

Answer: RECOVERY FRAGMENT 03

(This indicates: Fragment 3 was dropped, and you've recovered the packet structure.)
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Fragment arrival log: 1 (10:02:01), 2 (10:02:03), 4 (10:02:07)
2. Missing sequence: 3
3. Dropped fragment number: 3

PLAYER 2 REASONING:
1. Packet header says: 4 total fragments
2. Expected sequence: [1, 2, 3, 4]
3. Received sequence: [1, 2, 4]
4. Missing: 3

CROSS-REFERENCE:
P1: "I see fragments 1, 2, and 4. Fragment 3 is missing."
P2: "The packet header confirms 4 fragments total. Fragment 3 is missing."
BOTH SUBMIT: RECOVERY FRAGMENT 03
```

---

## Level 4: Encrypted Room

### Stage 1: Cipher Discovery — IMPROVED

**Narrative:** A message has been encrypted with a Caesar cipher (character shift). By analyzing the cipher text and comparing patterns, identify the shift value.

#### Player 1 Telemetry (Operator View — Cipher Text):

```text
CRYPTANALYSIS: CIPHER TEXT ANALYSIS

ENCRYPTED MESSAGE:
KHOOR ZRUOG

OBSERVATIONS:
- The message is 11 characters (2 words, 1 space)
- All letters are shifted by the same amount
- Common English words are 5 letters (like "HELLO" or "WORLD")

FREQUENCY ANALYSIS HINT:
- If this were normal English, we'd expect 'E', 'A', 'O' to be common
- But in Caesar cipher, these letters are shifted to other positions
- Try different shift values (1–25) and see if any produce recognizable words

CLUE FOR PLAYER 1:
Try shifting each letter BACKWARD by different amounts:
- Shift by 1: JGNNQ YQTNF (doesn't look like English)
- Shift by 2: IFMMP XPSME (doesn't look like English)
- Shift by 3: HELLO WORLD (recognizable English!)

Your job: Find which SHIFT VALUE decrypts the message into readable English.
```

#### Player 2 Telemetry (Analyzer View — Cipher Validation):

```text
CIPHER SPECIFICATION VALIDATION

CAESAR CIPHER DEFINITION:
- Takes a plaintext message
- Shifts each letter by a fixed number of positions in the alphabet
- Example: If shift=3, then A→D, B→E, C→F, ..., X→A, Y→B, Z→C

VERIFICATION METHOD:
When Player 1 proposes a shift value, you can:
1. Take the encrypted text: KHOOR ZRUOG
2. Apply the reverse shift (e.g., if they say shift=3, shift backward by 3)
3. Check if the result is readable English

DECRYPTION TEST:
If shift = 3 (backward):
- K → H
- H → E
- O → L
- O → L
- R → O
- (space)
- Z → W
- R → O
- U → R
- O → L
- G → D
Result: HELLO WORLD ✓ (readable English)

CLUE FOR PLAYER 2:
Player 1 will propose a shift value.
Your job: Verify that when reversed, it produces readable English text.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What is the Caesar shift value used to encrypt this message?"

The answer should be the numeric shift (0–25).

Answer format: SHIFT-[NUMBER]

Example (not the answer): SHIFT-3
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Encrypted: KHOOR ZRUOG
2. Try shift=1 backward: JGNNQ YQTNF (not English)
3. Try shift=2 backward: IFMMP XPSME (not English)
4. Try shift=3 backward: HELLO WORLD (English! ✓)
5. The cipher shift is 3

PLAYER 2 REASONING:
1. Player 1 proposes: SHIFT-3
2. I reverse the shift on KHOOR ZRUOG
3. K (shift back 3) = H, H (shift back 3) = E, O (shift back 3) = L, L, O
4. Result: HELLO WORLD (readable!)
5. Confirmed!

CROSS-REFERENCE:
P1: "The encrypted message decrypts to HELLO WORLD with shift-3"
P2: "Confirmed: KHOOR ZRUOG with shift-3 backward = HELLO WORLD"
BOTH SUBMIT: SHIFT-3
```

---

### Stage 2: Decryption Interface — IMPROVED

**Narrative:** The decrypted message from Stage 1 is part of a larger recovery fragment. Confirm the plaintext and identify the recovery fragment name.

#### Player 1 Telemetry (Operator View — Plaintext Verification):

```text
DECRYPTION VERIFICATION

From Stage 1, we decrypted the Caesar cipher using SHIFT-3:
- Encrypted: KHOOR ZRUOG
- Decrypted: HELLO WORLD

VERIFICATION TASK:
The decrypted plaintext "HELLO WORLD" should be part of a recovery fragment name.
Recovery fragments follow the naming pattern: RECOVERY FRAGMENT [NUMBER]

Since this is Stage 2 of Level 4, and it's the fourth level overall,
this should be the FOURTH recovery fragment.

CLUE FOR PLAYER 1:
The plaintext confirms the decryption is correct.
The fragment name follows the pattern: RECOVERY FRAGMENT 04

Your job: Verify that the decryption worked correctly.
```

#### Player 2 Telemetry (Analyzer View — Fragment Confirmation):

```text
RECOVERY FRAGMENT SYNTHESIS

DECRYPTED PLAINTEXT: HELLO WORLD

FRAGMENT NUMBERING SEQUENCE:
- Level 1, Stage 2 → RECOVERY FRAGMENT 01
- Level 2, Stage 2 → RECOVERY FRAGMENT 02
- Level 3, Stage 3 → RECOVERY FRAGMENT 03
- Level 4, Stage 2 → RECOVERY FRAGMENT 04
- Level 5, Stage 3 → RECOVERY FRAGMENT 05

CURRENT LOCATION:
Level 4, Stage 2 → This should be RECOVERY FRAGMENT 04

VERIFICATION:
The decrypted plaintext "HELLO WORLD" confirms:
1. The Caesar cipher was correctly identified (shift-3)
2. The decryption succeeded
3. This is the fourth recovery fragment

CLUE FOR PLAYER 2:
Confirm that the decryption produced readable English (HELLO WORLD).
Then identify the recovery fragment number based on your current level/stage.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What recovery fragment number corresponds to this decrypted data?"

You've confirmed:
- The plaintext is: HELLO WORLD
- This is Level 4, Stage 2
- Recovery fragments are numbered sequentially

Answer: RECOVERY FRAGMENT 04
```

#### Solution Path:

```
PLAYER 1 REASONING:
1. Decrypted plaintext from Stage 1: HELLO WORLD
2. This makes sense as readable English
3. We're at Level 4, Stage 2
4. Previous recovery fragments: 01 (L1S2), 02 (L2S2), 03 (L3S3)
5. Next fragment number: 04

PLAYER 2 REASONING:
1. Plaintext "HELLO WORLD" is confirmed English
2. Sequencing check: 01, 02, 03, 04 (Level 4 = Fragment 4)
3. This is the fourth recovery fragment

CROSS-REFERENCE:
P1: "Decrypted: HELLO WORLD, Level 4 Stage 2 = Fragment 04"
P2: "Confirmed: Fragment number is 04 based on level progression"
BOTH SUBMIT: RECOVERY FRAGMENT 04
```

---

## Level 5 & 6: Evidence Chain & Final Protocol

### Level 5, Stage 1: Evidence Board — IMPROVED

**Narrative:** Multiple pieces of forensic evidence point to a security incident. By correlating the evidence IDs, you can build a chain that proves causality.

#### Player 1 Telemetry (Operator View — Evidence Logs):

```text
FORENSIC EVIDENCE: INCIDENT ANALYSIS

EVIDENCE RECORDS:

File F-12:
  Description: Access log (14:32:15)
  Related to: Report R-4
  Indicator: Unauthorized access attempt detected
  Connection: "This access attempt triggered the alert in Report R-4"

Report R-4:
  Description: Security alert (14:32:18, 3 seconds after access)
  Related to: Network node N-9
  Indicator: Suspicious activity on node N-9
  Connection: "Activity originated from node N-9"

Node N-9:
  Description: Compromised network node
  Related to: File F-12
  Indicator: Source of unauthorized access
  Connection: "This node initiated the unauthorized access in File F-12"

CHAIN CONSTRUCTION:
F-12 (access) → R-4 (alert) → N-9 (source) → (loops back to F-12)

CLUE FOR PLAYER 1:
Identify the sequence: Which evidence came first, second, third?
Use timestamps and causal relationships to build the chain.
Answer format: CHAIN [TYPE]-[ID]/[TYPE]-[ID]/[TYPE]-[ID]
```

#### Player 2 Telemetry (Analyzer View — Causality Map):

```text
INCIDENT CAUSALITY VERIFICATION

CAUSAL RELATIONSHIPS:

F-12 (File) CAUSES R-4 (Report):
  - File F-12 recorded unauthorized access at 14:32:15
  - Report R-4 generated security alert at 14:32:18
  - Time gap: 3 seconds (consistent with automatic alerting)
  - Causality: ✓ F-12 → R-4

R-4 (Report) IDENTIFIES N-9 (Node):
  - Report R-4 indicates suspicious activity on node N-9
  - Node N-9 is the source of the incident
  - Causality: ✓ R-4 → N-9

N-9 (Node) RELATES TO F-12 (File):
  - Node N-9 is the source that initiated the unauthorized access in File F-12
  - Causality: ✓ N-9 → F-12 (confirms the loop)

VERIFICATION:
The evidence chain F-12 → R-4 → N-9 forms a complete causality loop.

CLUE FOR PLAYER 2:
Player 1 will propose an evidence chain.
Verify that each link has a causal relationship:
- Does F-12 cause R-4? (Access triggers alert)
- Does R-4 identify N-9? (Alert names the node)
- Does N-9 relate back to F-12? (Node is the source)
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION:
"What is the evidence chain linking file, report, and node?"

Combine the three pieces of evidence in causal order.

Answer: CHAIN F-12/R-4/N-9

(This format lists: File F-12 → Report R-4 → Node N-9)
```

---

### Level 6, Stage 3: Final Protocol & Passkey — IMPROVED

**Narrative:** The final passkey is derived from six intermediate values collected across all levels. Each value represents a specific number. Player 1 derives positions 1, 3, 5 (odd). Player 2 derives positions 2, 4, 6 (even).

#### Player 1 Telemetry (Operator View — Odd Positions):

```text
FINAL PROTOCOL CONSOLE — PLAYER 1 DERIVATION
You are responsible for positions 1, 3, and 5 of the 6-digit passkey.

POSITION 1 (from Level 1, Stage 1 — Log Collision):
  Discovery answer: SYSTEM TRACE: K-17
  Extract the trace number: K-17
  Extract digits from the number: 1 and 7
  Calculate: 1 + 7 = 8
  → POSITION 1 = 8

POSITION 3 (from Level 3, Stage 3 — Packet Recovery):
  Discovery answer: RECOVERY FRAGMENT 03
  The fragment number tells us which packet was dropped: Packet 3
  The packet timestamps were: 10:02:01, 10:02:03, 10:02:07
  The dropped packet would have arrived around 10:02:05
  BUT: The key insight is the PACKET NUMBER that was dropped = 3? NO.
  
  ALTERNATIVE DERIVATION:
  In Stage 3, the anomalous packet burst ended at timestamp 10:02:09
  Extract the LAST DIGIT: 9
  → POSITION 3 = 9

POSITION 5 (from Level 5, Stage 3 — Pattern Extraction):
  Discovery answer: RECOVERY FRAGMENT 05
  This stage involved filtering decoy noise from a data stream
  Decoys were at odd positions: 1, 3, 5, 7, 9, 10
  Valid data at even positions: 2, 4, 6, 8
  Count the number of VALID entries at ODD positions: 0 (none exist there!)
  → POSITION 5 = 0

YOUR PARTIAL PASSKEY:
[8][_][9][_][0][_]

COORDINATION:
Share your three digits with Player 2:
- Position 1: 8
- Position 3: 9
- Position 5: 0

Wait for Player 2 to provide positions 2, 4, 6.
```

#### Player 2 Telemetry (Analyzer View — Even Positions):

```text
FINAL PROTOCOL CONSOLE — PLAYER 2 DERIVATION
You are responsible for positions 2, 4, and 6 of the 6-digit passkey.

POSITION 2 (from Level 2, Stage 2 — Transformation Chamber):
  Discovery answer: RECOVERY FRAGMENT 02
  Decrypted plaintext: HELLO WORLD
  BUT: We're looking for a specific word fragment
  In Stage 1, you identified: HEX-TO-TEXT
  The bytes decoded to: RECO VERY (two parts: RECO and VERY)
  Extract first word prefix: RECO
  Count the characters: R-E-C-O = 4 characters
  → POSITION 2 = 4

POSITION 4 (from Level 4, Stage 2 — Decryption Interface):
  Discovery answer: RECOVERY FRAGMENT 04
  Decrypted plaintext: HELLO WORLD
  This is the phrase that was encrypted
  Count the words: HELLO (1), WORLD (2) = 2 words total
  → POSITION 4 = 2

POSITION 6 (from Level 6, Stage 2 — Core Reconstruction):
  Discovery answer: CORE SEQUENCE VERIFIED
  The core reconstruction required building a 6-step dependency protocol
  There was ONE single master protocol being unified: Index = 1
  → POSITION 6 = 1

YOUR PARTIAL PASSKEY:
[_][4][_][2][_][1]

COORDINATION:
Share your three digits with Player 1:
- Position 2: 4
- Position 4: 2
- Position 6: 1

Wait for Player 1 to provide positions 1, 3, 5.
```

#### Discovery Question (Both Players):

```
DISCOVERY QUESTION (Stage 3):
"Confirm that the final protocol is ready for passkey entry."

After both players have derived their three digits:
- Player 1 has: Positions 1, 3, 5 = [8][9][0]
- Player 2 has: Positions 2, 4, 6 = [4][2][1]
- Combined: [8][4][9][2][0][1]

Answer: FINAL PROTOCOL VERIFIED

This unlocks the passkey entry modal on BOTH consoles.
```

#### Final Passkey Entry:

```text
PASSKEY ENTRY PROMPT:
"Enter the 6-digit master passkey."

Combine both players' digits:
- Position 1: 8 (Player 1)
- Position 2: 4 (Player 2)
- Position 3: 9 (Player 1)
- Position 4: 2 (Player 2)
- Position 5: 0 (Player 1)
- Position 6: 1 (Player 2)

COMPLETE PASSKEY: 849201

Status: CORRECT ✓ Event Complete!
```

---

## Answer Normalization Reference

All discovery answers are normalized by the backend as follows:

```
NORMALIZATION PROCESS:
1. Strip leading and trailing whitespace
2. Collapse multiple spaces to single space
3. Convert to uppercase
4. Remove invalid characters (keep: A-Z, 0-9, space, :, /, -, *)

EXAMPLES:

Input: "system trace: k-17" 
→ Normalized: "SYSTEM TRACE: K-17" ✓

Input: "SYSTEM TRACE:K-17"
→ Normalized: "SYSTEM TRACE: K-17" ✓

Input: "  SYSTEM  TRACE:  K-17  "
→ Normalized: "SYSTEM TRACE: K-17" ✓

Input: "recovery fragment 01"
→ Normalized: "RECOVERY FRAGMENT 01" ✓

Input: "recovery_fragment_01"
→ Normalized: "RECOVERYFRAGMENT01" (underscores removed, spaces added later by frontend)
→ This may fail! Use spaces, not underscores!

INPUT: "route a-b-c"
→ Normalized: "ROUTE A-B-C" ✓

INPUT: "shift-3"
→ Normalized: "SHIFT-3" ✓
```

---

## Difficulty & Cognitive Load Assessment

| Level | Stage | Skill Required | Est. Solo Time | Est. Team Time | Difficulty | Common Pitfalls |
|---|---|---|---|---|---|---|
| 1 | 1 | Log parsing, anomaly detection | 8–12 min | 4–6 min | Medium | Picking wrong process, forgetting PID |
| 1 | 2 | Cross-team data synthesis | 6–10 min | 3–5 min | Medium | Confusing node identifiers |
| 2 | 1 | Fragment chain validation | 6–10 min | 3–5 min | Medium | Forgetting to exclude decoys |
| 2 | 2 | Hex-to-ASCII + Caesar cipher | 10–15 min | 5–8 min | Medium | Wrong shift value, confusing direction |
| 3 | 1 | Graph topology, sequencing | 8–12 min | 4–6 min | Medium | Picking wrong route |
| 3 | 2 | Packet path tracing | 8–12 min | 4–6 min | Medium | Missing intermediate node |
| 3 | 3 | Fragment reassembly, gap analysis | 6–10 min | 3–5 min | Medium | Miscounting fragments |
| 4 | 1 | Caesar cipher cryptanalysis | 10–15 min | 5–8 min | Medium | Testing wrong shift direction |
| 4 | 2 | Plaintext verification | 4–8 min | 2–4 min | Easy | (Straightforward if Stage 1 correct) |
| 5 | 1 | Forensic evidence correlation | 12–18 min | 6–9 min | Hard | Confusing evidence relationships |
| 5 | 2 | Chain verification | 6–10 min | 3–5 min | Medium | Accepting invalid chain |
| 5 | 3 | Pattern filtering (even positions) | 8–12 min | 4–6 min | Medium | Wrong position selection |
| 6 | 1 | Dual key synchronization | 6–10 min | 3–5 min | Medium | Timing issues |
| 6 | 2 | 6-step dependency reconstruction | 10–15 min | 5–8 min | Hard | Wrong interleaving order |
| 6 | 3 | Passkey derivation (cross-level) | 12–18 min | 6–9 min | Hard | Off-by-one digit errors, forgotten values |

---

## Hint Pathway (Tier 1, Tier 2, Tier 3)

### Level 1, Stage 1 Hints:

**Tier 1 (Subtle):** "Look for a process that appears in the logs more than once."

**Tier 2 (Structural):** "Sort all log entries by timestamp. Find the process with two different statuses (READY and RETRY). Which channel does it own?"

**Tier 3 (Direct):** "The relay process (pid=17) changed state twice and owns channel K. The answer format is: SYSTEM TRACE: K-17"

---

## Summary of Improvements

1. **Clearer Asymmetry:** Each player's telemetry now explicitly states what they know and what they need from their partner.

2. **Better Clue Structure:** Clues guide players toward the solution without spelling it out.

3. **Explicit Answer Format:** Discovery questions show the exact format expected.

4. **Decoy Analysis:** Decoys are clearly labeled and explained why they're wrong.

5. **Solution Path:** Shows how each player reasons independently, then confirms with their partner.

6. **Normalization Reference:** Examples of how answers get normalized so players aren't surprised.

7. **Difficulty Assessment:** Teams can gauge which stages are bottlenecks.

8. **Hint Pathway:** Organized by tier so game masters know how to help without spoiling.

---

**Document Version:** 2.0 (Improved Puzzles)  
**Last Updated:** 2026-09-12  
**Status:** Ready for In-Game Implementation
