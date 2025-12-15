@echo off
echo ========================================
echo   Installing PM2 and Starting Server
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking if PM2 is installed...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo PM2 not found. Installing PM2 globally...
    echo This requires administrator privileges.
    echo.
    call npm install -g pm2
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install PM2
        echo Please run this as Administrator or install PM2 manually:
        echo npm install -g pm2
        pause
        exit /b 1
    )
    echo PM2 installed successfully!
) else (
    echo PM2 is already installed!
)

echo.
echo Step 2: Creating logs directory...
if not exist "logs" mkdir logs

echo.
echo Step 3: Starting server with PM2...
pm2 start ecosystem.config.js

echo.
echo Step 4: Saving PM2 configuration...
pm2 save

echo.
echo ========================================
echo   Server is now running in background!
echo ========================================
echo.
echo You can now close this window.
echo.
echo To manage the server, use these commands:
echo   pm2 status          - View server status
echo   pm2 logs            - View server logs
echo   pm2 stop mlm-property-backend  - Stop server
echo   pm2 restart mlm-property-backend - Restart server
echo.
echo To make server start on boot, run:
echo   pm2 startup
echo.
pause

