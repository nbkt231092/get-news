@echo off
title OnlyNews Server (localhost:8001)
cd /d "%~dp0"

echo ===================================================
echo   OnlyNews Server - http://localhost:8001
echo ===================================================
echo.

REM Free port 8001 if an old process is still listening
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo [INFO] Stopping existing process on port 8001 (PID: %%a^)...
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Build initial news data if site\data\meta.json does not exist
if not exist "site\data\meta.json" (
    echo [INFO] Building initial news data...
    call npm run build
    echo.
)

REM Open http://localhost:8001 in default browser
echo [INFO] Opening http://localhost:8001 in browser...
start "" "http://localhost:8001"

REM Start Node server on port 8001
echo [INFO] Server is running. Keep this window open while using OnlyNews.
echo [INFO] Press Ctrl+C to stop the server.
echo.
node server.js

pause
