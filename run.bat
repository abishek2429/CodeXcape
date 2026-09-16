@echo off
echo =======================================================
echo          STARTING CODEXCAPE TECHNICAL ESCAPE ROOM
echo =======================================================
echo.

echo [1/3] Starting PostgreSQL Container via Docker Compose...
docker compose up -d postgres
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start PostgreSQL container. Please ensure Docker Desktop is running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting Node.js Express Backend in a new process...
netstat -ano | findstr /C:":8080" | findstr /C:"LISTENING" >nul
if not errorlevel 1 (
    echo [INFO] Backend is already running on port 8080. Skipping duplicate start.
) else (
    set "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/technical_escape_room"
    start "CodeXcape Backend (Port 8080)" cmd /k "cd /d %~dp0backend && npm.cmd start"
)

echo.
echo [3/3] Starting React Frontend Dev Server in a new process...
netstat -ano | findstr /C:":5173" | findstr /C:"LISTENING" >nul
if not errorlevel 1 (
    echo [INFO] Frontend is already running on port 5173. Skipping duplicate start.
) else (
    start "CodeXcape Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"
)

echo.
echo =======================================================
echo  CodeXcape is launching!
echo  - Backend:  http://localhost:8080/api/health
echo  - Frontend: http://localhost:5173/
echo  - Admin:    http://localhost:5173/admin
echo =======================================================
echo.
