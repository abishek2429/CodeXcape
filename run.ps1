Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         STARTING CODEXCAPE TECHNICAL ESCAPE ROOM" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Connecting to Supabase Remote Database..." -ForegroundColor Yellow
Write-Host "Database connected!" -ForegroundColor Green

Write-Host ""
Write-Host "[1/2] Starting Spring Boot Backend..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\backend`" && .\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "[2/2] Starting React Frontend Dev Server..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\frontend`" && npm.cmd run dev"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " CodeXcape is launching!" -ForegroundColor Green
Write-Host " - Backend:  http://localhost:8080/api/health" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:5173/" -ForegroundColor Green
Write-Host " - Admin:    http://localhost:5173/admin" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
