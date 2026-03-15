@echo off
setlocal

REM Start API + painel in a dedicated terminal window
start "REVIVE Dev" cmd /k "cd /d c:\revive-claude && npm run dev:stack"

REM Open the PWA URL (default browser)
start "" "http://localhost:5173"

endlocal
