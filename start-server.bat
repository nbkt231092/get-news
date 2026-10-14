@echo off
chcp 65001 >nul
title OnlyNews Server (localhost:8001)
cd /d "%~dp0"

echo ===================================================
echo   OnlyNews Server - http://localhost:8001
echo ===================================================
echo.

:: Giải phóng cổng 8001 nếu đang có tiến trình cũ chạy ngầm
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do (
    echo [INFO] Stopping existing process on port 8001 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Nếu dữ liệu chưa được build lần nào thì tự động build trước khi chạy
if not exist "site\data\meta.json" (
    echo [INFO] Building initial news data...
    call npm run build
    echo.
)

:: Tự động mở trình duyệt tại http://localhost:8001
echo [INFO] Opening http://localhost:8001 in browser...
start "" http://localhost:8001

:: Chạy Node server tại cổng 8001
echo [INFO] Server is running. Keep this window open while using OnlyNews.
echo [INFO] Press Ctrl+C to stop the server.
echo.
node server.js

pause
