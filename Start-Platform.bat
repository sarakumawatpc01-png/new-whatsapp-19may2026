@echo off
title WhatsApp AI Start script
echo ==============================================
echo        Starting WhatsApp AI Platform
echo ==============================================
echo.

echo [1/3] Checking environment variables...
if not exist ".env" (
    echo Error: .env file not found. Copying from .env.example...
    copy .env.example .env
    echo Please configure your .env file and restart.
    pause
    exit /b
)

echo [2/3] Starting local Mock Redis Server...
start "Platform Redis (Close this window to stop Redis)" /MIN cmd /c "node redis-local.mjs"

timeout /t 2 /nobreak > nul

echo [3/3] Starting all applications (API, Admin, Web, Worker)...
echo.
echo Press Ctrl+C in this window to stop the servers.
echo You can access the apps at:
echo - Admin Panel: http://localhost:3001
echo - Web App:     http://localhost:3000
echo - API:         http://localhost:3002
echo ==============================================

pnpm dev
