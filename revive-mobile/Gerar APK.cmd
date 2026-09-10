@echo off
cd /d "%~dp0"
call npm run android:apk
if errorlevel 1 (
  echo Nao foi possivel gerar o APK. Veja o erro acima.
) else (
  echo APK disponivel na pasta output: revive-local.apk
)
pause
