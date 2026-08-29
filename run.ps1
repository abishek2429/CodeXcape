Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         STARTING CODEXCAPE TECHNICAL ESCAPE ROOM" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Starting PostgreSQL Container via Docker Compose..." -ForegroundColor Yellow
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start PostgreSQL container. Please ensure Docker Desktop is running." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/3] Starting Spring Boot Backend..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\backend`" && .\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "[3/3] Starting React Frontend Dev Server..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\frontend`" && npm.cmd run dev"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " CodeXcape is launching!" -ForegroundColor Green
Write-Host " - Backend:  http://localhost:8080/api/health" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:5173/" -ForegroundColor Green
Write-Host " - Admin:    http://localhost:5173/admin" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
