@echo off
title MLM Property Backend Server
color 0A
echo.
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.
cd /d "%~dp0"
echo Current Directory: %CD%
echo.
echo Starting server on port 5000...
echo.
echo IMPORTANT: Keep this window open!
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npm run dev

echo.
echo Server stopped.
pause

