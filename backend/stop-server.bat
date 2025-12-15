@echo off
echo Stopping MLM Property Backend Server...
echo.
cd /d "%~dp0"
pm2 stop mlm-property-backend
pm2 delete mlm-property-backend
echo.
echo Server stopped!
pause

