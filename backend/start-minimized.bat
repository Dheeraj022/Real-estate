@echo off
if not "%1"=="min" start /min cmd /c "%~0" min & exit
cd /d "%~dp0"
title MLM Property Backend Server
npm run dev

