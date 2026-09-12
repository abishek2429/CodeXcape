# CodeXcape — Master Technical Documentation & Puzzle Solution Guide

This document is the authoritative reference for all **6 Levels** and **15 Stages** of the CodeXcape technical escape room. It is designed for event organizers, technical evaluators, game masters, and documentation archives.

---

## Table of Contents
1. [Game Architecture & Cooperative Mechanics](#1-game-architecture--cooperative-mechanics)
2. [Master Quick-Reference Cheat Sheet](#2-master-quick-reference-cheat-sheet)
3. [Level 1: System Reconstruction](#3-level-1-system-reconstruction)
   - [Stage 1: Log Collision](#stage-1-log-collision)
   - [Stage 2: Access Panel](#stage-2-access-panel)
4. [Level 2: Data Vault](#4-level-2-data-vault)
   - [Stage 1: Fragment Vault](#stage-1-fragment-vault)
   - [Stage 2: Transformation Chamber](#stage-2-transformation-chamber)
5. [Level 3: Network Incident](#5-level-3-network-incident)
   - [Stage 1: Network Reconstruction](#stage-1-network-reconstruction)
   - [Stage 2: Trace The Connection](#stage-2-trace-the-connection)
   - [Stage 3: Packet Recovery](#stage-3-packet-recovery)
6. [Level 4: Encrypted Room](#6-level-4-encrypted-room)
   - [Stage 1: Cipher Discovery](#stage-1-cipher-discovery)
   - [Stage 2: Decryption Interface](#stage-2-decryption-interface)
7. [Level 5: Collapsed System](#7-level-5-collapsed-system)
   - [Stage 1: Evidence Board](#stage-1-evidence-board)
   - [Stage 2: Evidence Chain](#stage-2-evidence-chain)
   - [Stage 3: Pattern Extraction](#stage-3-pattern-extraction)
8. [Level 6: The Core & Final Escape Protocol](#8-level-6-the-core--final-escape-protocol)
   - [Stage 1: Dual Key](#stage-1-dual-key)
   - [Stage 2: Core Reconstruction](#stage-2-core-reconstruction)
   - [Stage 3: Final Protocol & Master Passkey](#stage-3-final-protocol--master-passkey)
9. [Mathematical Synthesis of the Master Passkey (`849201`)](#9-mathematical-synthesis-of-the-master-passkey-849201)
10. [Organizer & Admin Reference Guide](#10-organizer--admin-reference-guide)

---

## 1. Game Architecture & Cooperative Mechanics

CodeXcape is an **asymmetric cooperative escape room**. Two players collaborate under a unified team identity:
* **Player 1 (Operator):** Receives primary system logs, raw ingress streams, and odd-indexed key components.
* **Player 2 (Analyzer):** Receives component topologies, egress maps, decoding rules, and even-indexed key components.

### Core Rules
1. **Asymmetric Knowledge:** Neither player receives sufficient information to solve any stage independently.
2. **Dual-Console Synchronization:** Both players must submit the identical, normalized discovery answer on their consoles to unlock the next stage.
3. **Decoy Filtering:** Every stage contains decoy noise (e.g. routine backup logs, dropped scan packets, invalid checksums). Players must cross-reference their data to eliminate decoys.
4. **Answer Normalization:** The backend automatically strips excess whitespace and normalizes text to uppercase (`NORMALIZED_TEXT_EXACT`).

---

## 2. Master Quick-Reference Cheat Sheet

| Level | Stage | Stage Title | Technical Category | Difficulty | Exact Discovery Answer | Passkey Contribution |
| :---: | :---: | :--- | :--- | :---: | :--- | :---: |
| **L1** | **S1** | Log Collision | Sequencing / Correlation | Medium | `SYSTEM TRACE: K-17` | Pos 1: $1+7 = \mathbf{8}$ |
| **L1** | **S2** | Access Panel | Systems Integration | Medium | `RECOVERY FRAGMENT 01` | — |
| **L2** | **S1** | Fragment Vault | Data Reconstruction | Medium | `HEX-TO-TEXT` | — |
| **L2** | **S2** | Transformation Chamber | Hex / ASCII Transformation | Medium | `RECOVERY FRAGMENT 02` | Pos 2: `RECO` length = $\mathbf{4}$ |
| **L3** | **S1** | Network Reconstruction | Graph Topology | Medium | `ROUTE A-B-C` | — |
| **L3** | **S2** | Trace The Connection | Network Forensics | Medium | `PACKET PATH C-E` | — |
| **L3** | **S3** | Packet Recovery | Packet Reassembly | Medium | `RECOVERY FRAGMENT 03` | Pos 3: Dropped packet = $\mathbf{9}$ |
| **L4** | **S1** | Cipher Discovery | Cryptanalysis (Caesar) | Medium | `SHIFT-3` | — |
| **L4** | **S2** | Decryption Interface | Decryption | Medium | `RECOVERY FRAGMENT 04` | Pos 4: `HELLO WORLD` words = $\mathbf{2}$ |
| **L5** | **S1** | Evidence Board | Forensic Correlation | Hard | `CHAIN F-12/R-4/N-9` | — |
| **L5** | **S2** | Evidence Chain | Cross-Level Lineage | Hard | `CHAIN VERIFIED` | — |
| **L5** | **S3** | Pattern Extraction | Pattern Recognition | Hard | `RECOVERY FRAGMENT 05` | Pos 5: Valid odd noise = $\mathbf{0}$ |
| **L6** | **S1** | Dual Key | Interlock Synchronization | Hard | `CORE ACCESS GRANTED` | — |
| **L6** | **S2** | Core Reconstruction | Dependency Protocol | Hard | `CORE SEQUENCE VERIFIED` | Pos 6: Protocol index = $\mathbf{1}$ |
| **L6** | **S3** | Final Protocol | Master Passkey Breach | Hard | `FINAL PROTOCOL VERIFIED` | **Passkey: `849201`** |

---

## 3. Level 1: System Reconstruction

### Stage 1: Log Collision
* **Technical Category:** `SEQUENCING` / `CORRELATION`
* **Player 1 Telemetry (Log Streams):**
  ```text
  LOG STREAM A:
  08:14:02 process=relay   pid=17 status=READY    channel=K
  08:14:11 process=watcher pid=04 status=REJECTED channel=K
  08:14:19 process=relay   pid=17 status=RETRY    channel=K
  08:14:27 process=archive pid=88 status=READ     channel=R

  LOG STREAM B:
  08:13:58 process=archive pid=88 status=READ     channel=R
  08:14:11 process=watcher pid=04 status=REJECTED channel=K

  DECOY LOG:
  09:02:44 process=backup  pid=99 status=COMPLETE channel=R
  ```
* **Player 2 Telemetry (Component Map):**
  ```text
  COMPONENT TOPOLOGY & CHANNEL MAP:
  - relay:   owns channel K (active transaction pipeline)
  - watcher: monitors channel K (observer mode)
  - archive: stores channel R (storage volume)

  RULES:
  - An abnormal retry remains bound to its assigned channel.
  - A rejected watcher event does not alter channel ownership.

  DECOY COMPONENT:
  - backup:  attached to channel R (routine snapshot)
  ```
* **Decoy Analysis:**
  - `backup pid=99` at `09:02:44` is an automated routine snapshot occurring outside the incident window.
* **Cooperative Derivation:**
  1. Player 1 chronologically sorts the log entries:
     - `08:13:58`: `archive` (READ, channel R)
     - `08:14:02`: `relay` (READY, channel K)
     - `08:14:11`: `watcher` (REJECTED, channel K)
     - `08:14:19`: `relay` (RETRY, channel K) $\leftarrow$ **Abnormal state change**
     - `08:14:27`: `archive` (READ, channel R)
  2. The process changing state twice is `relay` (`pid=17`).
  3. Player 2 confirms `relay` owns `channel K`.
  4. Trace format is `[Channel]-[PID]`: `K-17`.
* **Exact Answer:**
  ```text
  SYSTEM TRACE: K-17
  ```

---

### Stage 2: Access Panel
* **Technical Category:** `SYSTEMS`
* **Player 1 Telemetry (Access Panel Controls):**
  ```text
  Candidate Controls:
  - NODE SELECTOR: [N-2, N-4, N-7]
  - PROCESS SELECTOR: [relay, watcher, archive]
  - SEQUENCE SELECTOR: [K-17, R-03, M-22]

  ACTIVATION CRITERIA:
  1. The node bound to the abnormal channel identified in Stage 1.
  2. The process that performed the retry.
  3. The verified system trace label.
  ```
* **Player 2 Telemetry (Configuration Matrix):**
  ```text
  CONFIGURATION MATRIX:
  - Channel K is hosted on Node N-4.
  - Channel R is hosted on Node N-7.
  - Channel M is hosted on Node N-2.

  VERIFICATION RULES:
  - Node: selected by channel ownership (Channel K -> Node N-4)
  - Process: selected by abnormal retry (process relay)
  - Sequence: selected by Stage 1 trace (K-17)
  ```
* **Cooperative Derivation:**
  1. Node: Channel `K` from Stage 1 maps to **`N-4`** (Player 2).
  2. Process: The process that retried is **`relay`** (Player 1).
  3. Sequence: The Stage 1 trace is **`K-17`**.
  4. Both consoles configure `N-4` $\to$ `relay` $\to$ `K-17`.
* **Exact Answer:**
  ```text
  RECOVERY FRAGMENT 01
  ```

---

## 4. Level 2: Data Vault

### Stage 1: Fragment Vault
* **Technical Category:** `DATA-RECONSTRUCTION`
* **Player 1 Telemetry (Artifact Set A):**
  ```text
  - Fragment [B7]: ends with boundary marker 2F
  - Fragment [41]: begins with boundary marker 7B
  - Fragment [C3]: followed by boundary marker 2F
  - Decoy Fragment [99]: boundary marker checksum invalid
  ```
* **Player 2 Telemetry (Artifact Set B):**
  ```text
  - Valid Boundary Chain: [C3] -> [B7] -> [41]
  - Checksum marker aligns only after the third byte fragment [41].
  - Representation: The 2-character hexadecimal byte fragments map to raw computer bytes.
  - Decoy Fragment [D0]: unlinked orphan byte.
  ```
* **Decoy Analysis:**
  - Fragment `[99]` has an invalid checksum; Fragment `[D0]` is an orphan with no boundary match.
* **Cooperative Derivation:**
  1. Player 2 provides the boundary ordering: `[C3] -> [B7] -> [41]`.
  2. Player 1 confirms that `[C3]` links to `[B7]` via marker `2F`, and `[B7]` links to `[41]` via marker `7B`.
  3. Player 2 identifies the representation as hexadecimal pairs that translate into ASCII text.
* **Exact Answer:**
  ```text
  HEX-TO-TEXT
  ```

---

### Stage 2: Transformation Chamber
* **Technical Category:** `TRANSFORMATION`
* **Player 1 Telemetry (Byte Stream & Engines):**
  ```text
  Recovered Byte Stream: 52 45 43 4F 56 45 52 59
  AVAILABLE TRANSFORMATION ENGINES:
  - decimal-to-text
  - hex-to-text
  - reverse-bytes
  - base64-decode
  ```
* **Player 2 Telemetry (Byte Interpretation Matrix):**
  ```text
  Hexadecimal pairs map to readable ASCII characters:
  52 -> 'R'
  45 -> 'E'
  43 -> 'C'
  4F -> 'O'
  56 -> 'V'
  45 -> 'E'
  52 -> 'R'
  59 -> 'Y'
  Plaintext result: 'RECOVERY' (8 characters).
  ```
* **Cooperative Derivation:**
  1. Select engine: **`hex-to-text`**.
  2. Convert bytes:
     $$\text{0x52}='R',\; \text{0x45}='E',\; \text{0x43}='C',\; \text{0x4F}='O',\; \text{0x56}='V',\; \text{0x45}='E',\; \text{0x52}='R',\; \text{0x59}='Y'$$
  3. Decoded plaintext is `RECOVERY`. Both players submit the recovery fragment label.
* **Exact Answer:**
  ```text
  RECOVERY FRAGMENT 02
  ```

---

## 5. Level 3: Network Incident

### Stage 1: Network Reconstruction
* **Technical Category:** `NETWORK-RECONSTRUCTION`
* **Player 1 Telemetry (Local Ingress Topology):**
  ```text
  - Confirmed Edges: [A -> B] and [B -> C]
  - Unverified Candidate Edges: [A -> D], [C -> D], [B -> D]
  - Source Node: Node A
  ```
* **Player 2 Telemetry (Remote Egress Topology):**
  ```text
  - Confirmed Edges: [B -> C] and [C -> E]
  - Unverified Candidate Edges: [A -> E], [A -> D], [B -> D]
  - Destination Target: Node E
  ```
* **Decoy Analysis:**
  - Candidates `A-D`, `C-D`, `B-D`, and `A-E` are unverified decoy routes.
* **Cooperative Derivation:**
  1. Both players compare confirmed edges: `A -> B`, `B -> C`, `C -> E`.
  2. The valid transmission route originating at `A` through verified links is `ROUTE A-B-C`.
* **Exact Answer:**
  ```text
  ROUTE A-B-C
  ```

---

### Stage 2: Trace The Connection
* **Technical Category:** `NETWORK-FORENSICS`
* **Player 1 Telemetry (Flow Capture):**
  ```text
  - 10:02:01 [A -> B] SYN-ACK     // CONNECT (Normal)
  - 10:02:03 [B -> C] ROUTE_RELAY // FORWARD (Normal)
  - 10:02:04 [C -> E] DATA_BURST  // FORWARD (Payload: 0x504B)
  - 10:02:09 [A -> D] PROBE       // DROP (Decoy)
  ```
* **Player 2 Telemetry (Traffic Anomaly Report):**
  ```text
  - 10:02:03 [B -> C] FORWARD: legitimate protocol control
  - 10:02:04 [C -> E] FORWARD: unexpected binary burst detected
  - 10:02:09 [A -> D] DROP:    decoy scanning noise
  ```
* **Cooperative Derivation:**
  1. Ignore dropped probe `A -> D` at `10:02:09`.
  2. Hop `C -> E` at `10:02:04` contains an unauthorized data burst (`0x504B`).
  3. The suspicious egress hop is `C-E`.
* **Exact Answer:**
  ```text
  PACKET PATH C-E
  ```

---

### Stage 3: Packet Recovery
* **Technical Category:** `PACKET-RECOVERY`
* **Player 1 Telemetry (Corrupted Packet Segments):**
  ```text
  - Segment H: Header bytes   [50 4B]
  - Segment P: Payload bytes  [52 45 43 4F]
  - Segment C: Checksum bytes [56 45 52 59]
  - Decoy Segment X: Noise    [99 AA BB] (dropped link A->D)
  ```
* **Player 2 Telemetry (Packet Reassembly Protocol):**
  ```text
  - Assembly sequence: Header -> Payload -> Checksum
  - Route label selects C-E fragment, excludes dropped A-D fragment.
  - Reassembled packet payload matches the third recovery artifact.
  ```
* **Cooperative Derivation:**
  1. Discard noise segment `[99 AA BB]` from the dropped link `A->D`.
  2. Order segments:
     - Header `[50 4B]` ('PK' - standard ZIP/package header)
     - Payload `[52 45 43 4F]` ('RECO')
     - Checksum `[56 45 52 59]` ('VERY')
  3. Reassembly completes the 3rd recovery artifact.
* **Exact Answer:**
  ```text
  RECOVERY FRAGMENT 03
  ```

---

## 6. Level 4: Encrypted Room

### Stage 1: Cipher Discovery
* **Technical Category:** `CIPHER-REASONING`
* **Player 1 Telemetry (Cipher Telemetry Log):**
  ```text
  Observed character transformations:
  'A' -> 'D' (+3)
  'B' -> 'E' (+3)
  'M' -> 'P' (+3)
  Alphabetical distance is preserved across all transformed characters.
  ```
* **Player 2 Telemetry (Cipher Context Log):**
  ```text
  - Cipher type: Caesar Shift
  - Rotation parameter: Uniform alphabetical displacement
  - Reset rule: Non-alphabetic boundaries and spaces remain unaltered.
  ```
* **Cooperative Derivation:**
  1. Character shifts are uniformly $+3$ positions:
     $$\text{'A'} (1) \to \text{'D'} (4) \implies +3$$
     $$\text{'B'} (2) \to \text{'E'} (5) \implies +3$$
  2. Cipher family is Caesar Shift with rotation parameter $3$.
* **Exact Answer:**
  ```text
  SHIFT-3
  ```

---

### Stage 2: Decryption Interface
* **Technical Category:** `DECRYPTION`
* **Player 1 Telemetry (Ciphertext Blocks):**
  ```text
  Block 1: [KHOOR]
  Block 2: [ZRUOG]

  CANDIDATE TRANSFORMS:
  - shift-1
  - shift-3
  - reverse
  - substitution
  ```
* **Player 2 Telemetry (Decryption Matrix):**
  ```text
  Applying shift -3 to the ciphertext:
  [KHOOR] -> 'HELLO'
  [ZRUOG] -> 'WORLD'
  Plaintext output: 'HELLO WORLD' (2 words).
  ```
* **Cooperative Derivation:**
  1. Apply `shift-3` in reverse ($-3$ rotation):
     $$\text{KHOOR} \to \text{HELLO}$$
     $$\text{ZRUOG} \to \text{WORLD}$$
  2. Decrypted output: `HELLO WORLD` (2 words).
* **Exact Answer:**
  ```text
  RECOVERY FRAGMENT 04
  ```

---

## 7. Level 5: Collapsed System

### Stage 1: Evidence Board
* **Technical Category:** `FORENSICS`
* **Player 1 Telemetry (Dossier A):**
  ```text
  - File Record [F-12]: modified at 14:03:00 (Incident Trigger)
  - Security Identifier [R-4]: generated at 14:04:00
  - Network Broadcast [N-9]: initiated at 14:05:00 references ID [R-4]
  - Decoy File [F-88]: routine backup at 12:00:00 (ignore)
  ```
* **Player 2 Telemetry (Dossier B):**
  ```text
  - Process [P-7]: spawned at 14:04:00, reads Identifier [R-4] from File [F-12]
  - Network Socket [N-9]: opened at 14:05:00 by Process [P-7]
  - Decoy Process [P-2]: references obsolete ID [R-8] (ignore)
  ```
* **Decoy Analysis:**
  - `F-88` is a routine backup at 12:00:00; `P-2` and `R-8` are unlinked decoy artifacts.
* **Cooperative Derivation:**
  1. Timeline Correlation:
     - `14:03:00`: File `F-12` modified.
     - `14:04:00`: Process `P-7` reads security identifier `R-4` from file `F-12`.
     - `14:05:00`: Process `P-7` opens network socket `N-9` using identifier `R-4`.
  2. Connected chain: File `F-12` $\to$ Identifier `R-4` $\to$ Network `N-9`.
* **Exact Answer:**
  ```text
  CHAIN F-12/R-4/N-9
  ```

---

### Stage 2: Evidence Chain
* **Technical Category:** `FORENSICS`
* **Player 1 Telemetry (Node P-7 Artifacts):**
  ```text
  - Linked file points to transformation record [T-3].
  - Record [T-3] contains a reference to RECOVERY FRAGMENT 02 recovered in Level 2.
  - Decoy record [T-8]: invalid checksum (ignore).
  ```
* **Player 2 Telemetry (Cross-Level Verification):**
  ```text
  - Record [T-3] is verified: its hash matches RECOVERY FRAGMENT 02 from Level 2.
  - The forensic link between Level 2 and Node N-9 is established.
  ```
* **Cooperative Derivation:**
  1. Discard decoy record `T-8`.
  2. Transformation record `T-3` matches the cryptographic hash of `RECOVERY FRAGMENT 02` from Level 2 Stage 2.
  3. Both consoles confirm cross-level verification.
* **Exact Answer:**
  ```text
  CHAIN VERIFIED
  ```

---

### Stage 3: Pattern Extraction
* **Technical Category:** `PATTERN-RECOGNITION`
* **Player 1 Telemetry (Raw Telemetry Stream & Filter Rule):**
  ```text
  RAW TELEMETRY STREAM (10 SYMBOLS):
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

  EXTRACTION RULE:
  Filter to only even index positions: [2, 4, 6, 8].
  All odd index positions are decoy noise.
  ```
* **Player 2 Telemetry (Pattern Key):**
  ```text
  PATTERN INTERPRETATION KEY:
  - Extraction rule: Select even positions [2, 4, 6, 8] from the stream.
  - Target output: Extracted symbols confirm the final forensic marker: RECOVERY FRAGMENT 05.
  - Decoy noise: Odd positions [1, 3, 5, 7, 9, 10] contain misleading interference.
  ```
* **Cooperative Derivation:**
  1. Filter out all odd positions ($1, 3, 5, 7, 9, 10$).
  2. Extract symbols at positions $2, 4, 6, 8$:
     - Pos 2: `R`
     - Pos 4: `E`
     - Pos 6: `C`
     - Pos 8: `0`
  3. Filtered stream yields the fifth recovery fragment.
* **Exact Answer:**
  ```text
  RECOVERY FRAGMENT 05
  ```

---

## 8. Level 6: The Core & Final Escape Protocol

### Stage 1: Dual Key
* **Technical Category:** `PROTOCOL-RECONSTRUCTION`
* **Player 1 Telemetry (Key Shard Alpha):**
  ```text
  CORE KEY COMPONENT ALPHA:
  - Key Shard A: [ALPHA-77-PRIME]
  - Protocol Constraint: Core Key A unlocks primary authorization interlock.
  - Synchronization Requirement: Must engage concurrently with Core Key B.
  ```
* **Player 2 Telemetry (Key Shard Beta):**
  ```text
  CORE KEY COMPONENT BETA:
  - Key Shard B: [BETA-88-SECUNDUS]
  - Protocol Constraint: Core Key B unlocks secondary authorization interlock.
  - Synchronization Requirement: Both nodes must confirm authorization.
  ```
* **Cooperative Derivation:**
  1. Player 1 engages `ALPHA-77-PRIME`.
  2. Player 2 engages `BETA-88-SECUNDUS`.
  3. Both submit synchronization command concurrently.
* **Exact Answer:**
  ```text
  CORE ACCESS GRANTED
  ```

---

### Stage 2: Core Reconstruction
* **Technical Category:** `PROTOCOL-RECONSTRUCTION`
* **Player 1 Telemetry (Odd Dependency Edges):**
  ```text
  DEPENDENCY PROTOCOL (ODD EDGES):
  1. Level 1 Trace (K-17)     -> establishes Level 3 Route (A-B-C)
  3. Level 3 Packet (03)      -> confirms Level 2 Transform (HEX-TO-TEXT)
  5. Level 4 Cipher (SHIFT-3) -> exposes Level 5 Evidence Chain (F-12/R-4/N-9)
  ```
* **Player 2 Telemetry (Even Dependency Edges):**
  ```text
  DEPENDENCY PROTOCOL (EVEN EDGES):
  2. Level 3 Route (A-B-C)       -> selects Level 3 Packet (03)
  4. Level 2 Transform (HEX-TO-TEXT) -> verifies Level 4 Cipher (SHIFT-3)
  6. Level 5 Evidence Chain      -> extracts Level 5 Pattern (Fragment 05)
  ```
* **Cooperative Derivation:**
  1. Interleave odd and even dependency links:
     - Edge 1: Level 1 Trace $\to$ Level 3 Route
     - Edge 2: Level 3 Route $\to$ Level 3 Packet
     - Edge 3: Level 3 Packet $\to$ Level 2 Transform
     - Edge 4: Level 2 Transform $\to$ Level 4 Cipher
     - Edge 5: Level 4 Cipher $\to$ Level 5 Evidence Chain
     - Edge 6: Level 5 Evidence Chain $\to$ Level 5 Pattern
  2. Unified 6-step dependency protocol:
     $$\text{Trace} \to \text{Route} \to \text{Packet} \to \text{Transform} \to \text{Cipher} \to \text{Chain} \to \text{Pattern}$$
* **Exact Answer:**
  ```text
  CORE SEQUENCE VERIFIED
  ```

---

### Stage 3: Final Protocol & Master Passkey

#### Player 1 Telemetry (Odd Digits: 1, 3, 5):
```text
FINAL PROTOCOL CONSOLE - PRIMARY DERIVATION (ODD POSITIONS):
You are responsible for deriving POSITIONS 1, 3, and 5 of the 6-digit access code:

- POSITION 1 (from Level 1 Trace 'K-17'):
  Sum the digits of the trace number: 1 + 7 = 8.
  --> DIGIT 1 = 8

- POSITION 3 (from Level 3 Network Incident):
  Look at the suspicious data burst timestamp ending (10:02:09 dropped / packet 9).
  --> DIGIT 3 = 9

- POSITION 5 (from Level 5 Pattern Extraction):
  Count how many odd decoy positions were valid: 0.
  --> DIGIT 5 = 0

Your partial passkey mask: 8 _ 9 _ 0 _
```

#### Player 2 Telemetry (Even Digits: 2, 4, 6):
```text
FINAL PROTOCOL CONSOLE - SECONDARY DERIVATION (EVEN POSITIONS):
You are responsible for deriving POSITIONS 2, 4, and 6 of the 6-digit access code:

- POSITION 2 (from Level 2 Data Vault):
  Length of the first decoded ASCII word prefix 'RECO': 4 characters.
  --> DIGIT 2 = 4

- POSITION 4 (from Level 4 Decrypted Plaintext):
  Word count in the decrypted phrase 'HELLO WORLD': 2 words.
  --> DIGIT 4 = 2

- POSITION 6 (from Level 6 Core Protocol):
  The single master unified protocol index: 1.
  --> DIGIT 6 = 1

Your partial passkey mask: _ 4 _ 2 _ 1
```

* **Step Discovery Answer (unlocks passkey modal on both consoles):**
  ```text
  FINAL PROTOCOL VERIFIED
  ```

---

## 9. Mathematical Synthesis of the Master Passkey (`849201`)

The 6-digit access passkey is derived strictly through cross-level clue interleaving:

```text
┌────────────────────────────────────────────────────────┐
│               MASTER PASSKEY SYNTHESIS                 │
├────────────┬─────────────┬─────────────────────────────┤
│ Position 1 │ Player 1    │ Trace 'K-17' sum: 1 + 7 = 8 │ -> 8
│ Position 2 │ Player 2    │ Prefix 'RECO' length:     4 │ -> 4
│ Position 3 │ Player 1    │ Dropped packet probe:     9 │ -> 9
│ Position 4 │ Player 2    │ 'HELLO WORLD' word count: 2 │ -> 2
│ Position 5 │ Player 1    │ Valid odd decoy count:    0 │ -> 0
│ Position 6 │ Player 2    │ Core protocol index:      1 │ -> 1
└────────────┴─────────────┴─────────────────────────────┘
```

$$\mathbf{Passkey} = \mathbf{849201}$$

Entering `849201` into the final authorization prompt:
1. Stops the team timer.
2. Changes team state to `COMPLETED`.
3. Records final completion time on the admin leaderboard.

---

## 10. Organizer & Admin Reference Guide

### Default Team Credentials

| Team Code | Player 1 Passcode | Player 2 Passcode | Notes |
| :--- | :--- | :--- | :--- |
| **`CODEXCAPE-TEST`** | `TEST-P1-9021` | `TEST-P2-9021` | Sandbox testing team (auto-overrides stale sessions) |
| **`TEAM-ALPHA`** | `ALPHA-P1-4411` | `ALPHA-P2-4411` | Primary competition team |
| **`TEAM-BETA`** | `BETA-P1-1021` | `BETA-P2-1021` | Competition team 2 |
| **`TEAM-CHARLIE`** | `CHARLIE-P1-2032` | `CHARLIE-P2-2032` | Competition team 3 |
| **`TEAM-DELTA`** | `DELTA-P1-3043` | `DELTA-P2-3043` | Competition team 4 |
| **`TEAM-ECHO`** | `ECHO-P1-4054` | `ECHO-P2-4054` | Competition team 5 |

### Admin Console Access
* **URL:** `http://localhost:5173/admin` (or `/admin` on production deployment)
* **Admin Passcode:** `admin123`
* **Features:**
  - Real-time leaderboard monitoring
  - Force-reset team progress back to Level 1 (`POST /api/admin/teams/{id}/reset`)
  - Emergency event pause/resume
  - Live session audit logging
