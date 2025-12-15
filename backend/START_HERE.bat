@echo off
chcp 65001 >nul
echo ========================================
echo   MLM Property Backend Server
echo ========================================
echo.

REM Change to the script's directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure you're in the backend folder.
    pause
    exit /b 1
)

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Starting server...
echo.
echo ========================================
echo   Server will run on: http://localhost:5000
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause



