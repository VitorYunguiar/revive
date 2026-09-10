@echo off
cd /d "%~dp0"
call npm run android:studio
if errorlevel 1 pause
