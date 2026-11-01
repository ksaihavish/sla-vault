@echo off
echo ========================================================
echo   SLA-Vault: FinTech Performance Bond Platform
echo   CS2614 Fundamentals of Blockchain Mini Project Demo
echo ========================================================
echo.
echo Starting local demo server on port 8080...
start http://localhost:8080
python -m http.server 8080 --directory frontend
pause
