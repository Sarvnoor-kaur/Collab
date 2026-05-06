@echo off
echo Starting backend...
start cmd /k "cd backend && npm start"
timeout /t 2 /nobreak > nul

echo Starting frontend...
start cmd /k "cd client && npm start"

echo Servers starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
pause
