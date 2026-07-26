@echo off
cd /d "%~dp0"

echo Starting Atunda Dance Project...
echo Keep this window open while you use the site.
echo Close this window to stop the server.
echo.

start "" "http://localhost:8000"
python -m http.server 8000

if errorlevel 1 (
  echo.
  echo Could not start the server. Is Python installed?
  echo Try: py -m http.server 8000
  pause
)
