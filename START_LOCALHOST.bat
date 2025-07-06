@echo off
echo ========================================
echo   SPK BEASISWA - LOCALHOST DEVELOPMENT
echo ========================================
echo.

echo Starting Backend Server...
cd "backend-main\backend-main"
start "Backend Server" cmd /k "npm run local"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd "..\..\my-app-main"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo   Backend:  http://localhost:5001
echo   Frontend: http://localhost:5173
echo   Login:    admin / admin123
echo ========================================
echo.
pause