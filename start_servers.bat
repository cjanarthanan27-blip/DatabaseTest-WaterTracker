@echo off
echo Starting Water Tracker Servers...

:: Start Django Backend
echo Launching Django Backend on http://localhost:8000...
start "Water Tracker Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

:: Start Vite Frontend
echo Launching Vite Frontend on http://localhost:5173...
cd apps\water_tracker\frontend
start "Water Tracker Frontend" cmd /k "npm run dev -- --host"

echo.
echo Servers are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo.
pause
