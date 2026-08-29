# Technical Escape Room (CodeXcape)

## Purpose

**Technical Escape Room** is a web-based two-player cooperative challenge designed for college technical events. Teams of two players connect over a local area network (LAN) on separate computers to solve interconnected technical puzzles across 6 game levels. Every completed level unlocks a hint fragment towards a final six-digit passkey controlled strictly by the central game server.

---

## Technology Stack

### Backend
- **Java 21**
- **Spring Boot 3.3**
- **Maven**
- **Spring Web**
- **Spring Security**
- **Spring Data JPA**
- **Spring WebSocket** (STOMP)
- **Lombok**

### Database & Migrations
- **PostgreSQL 16**
- **Flyway**

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**

### Infrastructure
- **Docker & Docker Compose**
- **Nginx**

---

## Prerequisites

- **Java 21 JDK**
- **Node.js v20+** and `npm`
- **Docker Desktop** (with Docker Compose v2+)

---

## Project Structure

```text
technical-escape-room/
│
├── backend/                  # Spring Boot backend source code
│   ├── .mvn/wrapper/         # Maven wrapper properties & binaries
│   ├── mvnw / mvnw.cmd       # Maven wrapper scripts
│   ├── pom.xml               # Maven dependencies & plugins
│   └── src/
│       ├── main/java/        # Security, Controllers, Services, DTOs
│       └── main/resources/   # YML configurations & Flyway migrations
│
├── frontend/                 # React + TypeScript + Vite application
│   ├── package.json          # Node dependencies
│   ├── vite.config.ts        # Vite configuration & dev API proxy
│   ├── tailwind.config.js    # Tailwind CSS design system
│   └── src/                  # React pages, components, services, types
│
├── database/                 # SQL migrations & database scripts
│   └── migrations/           # V1 initial Flyway migrations
│
├── docker/                   # Dockerfiles & Nginx configurations
│   ├── backend/              # Multi-stage Java Dockerfile
│   ├── frontend/             # Multi-stage Node/Nginx Dockerfile
│   └── nginx/                # Nginx reverse proxy configuration
│
├── docs/                     # Architectural documentation
│
├── .gitignore
├── docker-compose.yml        # Multi-container service orchestrator
└── README.md
```

---

## Running CodeXcape

### 🚀 1-Click Launch (Antigravity IDE / Terminal)

In **Antigravity IDE**, simply click the **Run** button at the top (or press `Ctrl+Shift+B` / `Cmd+Shift+B` to trigger default task **"Run CodeXcape App (1-Click)"**).

Alternatively, execute the 1-click runner script directly from the root directory:

**Windows (PowerShell / CMD):**
```cmd
.\run.bat
```
*(or `.\run.ps1`)*

**Linux / macOS:**
```bash
chmod +x ./run.sh
./run.sh
```

This single command automatically:
1. Starts the PostgreSQL container via Docker Compose.
2. Launches the Spring Boot backend on `http://localhost:8080`.
3. Launches the React Vite frontend dev server on `http://localhost:5173`.

---

### Manual Step-by-Step Execution

### 1. Start PostgreSQL Database

Launch the persistent PostgreSQL database container using Docker Compose:

```bash
docker compose up -d postgres
```

To stop the database container:

```bash
docker compose down
```

### 2. Start Spring Boot Backend

Navigate to the `backend/` directory and execute the Spring Boot application using the bundled Maven Wrapper:

**Windows (PowerShell / CMD):**
```cmd
cd backend
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**
```bash
cd backend
chmod +x ./mvnw
./mvnw spring-boot:run
```

The backend server will start on port `8080`.
Verify backend health directly:
```text
GET http://localhost:8080/api/health
```

### 3. Start React Frontend

In a separate terminal, navigate to the `frontend/` directory, install dependencies, and launch Vite dev server:

**Windows (PowerShell / CMD):**
```cmd
cd frontend
cmd /c "npm install"
cmd /c "npm run dev"
```

**Linux / macOS:**
```bash
cd frontend
npm install
npm run dev
```

The frontend application will start at `http://localhost:5173`.

### 4. Access the Application

Open your browser at [http://localhost:5173](http://localhost:5173). You will see the Phase 1 Landing Page with live connectivity indicators:
- `Frontend: ONLINE`
- `Backend: ONLINE`
- `Database: ONLINE`

---

## Centralized Architecture Constraints

1. **Central Server Authoritative**: All game state, progression, and passkey verification logic are managed exclusively by the backend.
2. **Two-Player Cooperative Model**: Players connect individually via LAN using separate desktops.
3. **Passkey Security**: The six-digit passkey remains server-side and is never exposed in client API responses.
