@echo off
setlocal
cd /d "%~dp0"

echo Pushing Conquistador Oil MVP to GitHub...
echo If GitHub asks you to sign in, complete the browser or credential prompt.
echo.

git --git-dir="%~dp0repo-meta" --work-tree="%~dp0" -c http.sslBackend=openssl push https://github.com/khemia0101-del/webmaster.git main

echo.
if errorlevel 1 (
  echo Push did not finish. Please leave this window open and share the message above.
) else (
  echo Push complete.
)
pause
