#!/bin/bash
echo "======================================================="
echo "         STARTING CODEXCAPE TECHNICAL ESCAPE ROOM"
echo "======================================================="
echo ""

echo "[1/3] Starting PostgreSQL Container via Docker Compose..."
docker compose up -d postgres

echo ""
echo "[2/3] Starting Spring Boot Backend..."
(cd backend && ./mvnw spring-boot:run) &

echo ""
echo "[3/3] Starting React Frontend Dev Server..."
(cd frontend && npm run dev) &

echo ""
echo "======================================================="
echo " CodeXcape is launching!"
echo " - Backend:  http://localhost:8080/api/health"
echo " - Frontend: http://localhost:5173/"
echo " - Admin:    http://localhost:5173/admin"
echo "======================================================="
echo ""
