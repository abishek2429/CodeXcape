# Architecture Overview — Technical Escape Room

## System High-Level Topology

```
+-------------------------------------------------------------+
|                        LAN NETWORK                          |
|                                                             |
|   +-------------------+             +-------------------+   |
|   |  Player 1 Desktop |             |  Player 2 Desktop |   |
|   |  (React Browser)  |             |  (React Browser)  |   |
|   +---------+---------+             +---------+---------+   |
|             |                                 |             |
|             +----------------+----------------+             |
|                              |                              |
|                              v                              |
|                   +--------------------+                    |
|                   | Nginx Reverse Proxy|                    |
|                   +----------+---------+                    |
|                              |                              |
|                              v                              |
|                +---------------------------+                |
|                | Central Game Server       |                |
|                | (Spring Boot REST / WS)   |                |
|                +-------------+-------------+                |
|                              |                              |
|                              v                              |
|                +---------------------------+                |
|                | PostgreSQL Database       |                |
|                +---------------------------+                |
+-------------------------------------------------------------+
```

## Guiding Architectural Principles

1. **Centralized Server-Authoritative Logic**:
   - All game state, timers, level completion checks, hint calculations, and passkey verification are executed solely on the backend.
   - The browser frontend acts purely as a presentation layer.
2. **Two-Player Cooperative Model**:
   - Each team consists of Player 1 and Player 2.
   - Progress requires synchronous or asynchronous completion of interconnected challenges by both players.
3. **No Secret Exposure**:
   - The final six-digit passkey is generated and stored on the server side and is never transmitted in API responses to client browsers.
4. **LAN Resilience**:
   - Designed to run seamlessly on a local network using fixed IP addresses or local DNS with Docker orchestration.
