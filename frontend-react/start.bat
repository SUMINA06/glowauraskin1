@echo off
REM NepMart Frontend React - Quick Start Script

echo ================================
echo NepMart Frontend React Setup
echo ================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo. ❌ Error: package.json not found
    echo. Please run this script from frontend-react directory
    pause
    exit /b 1
)

echo. 📦 Dependencies installed (React, React Router, Axios)
echo.

echo. 🚀 Starting development server...
echo.
echo. Available at: http://localhost:5173
echo.
echo. Routes:
echo.   Frontend Home:    http://localhost:5173/
echo.   Admin Dashboard:  http://localhost:5173/admin
echo.   Product Categories: /wooden, /art, /bag, /clay, /jute, /wall, /pasmina
echo.
echo. Press Ctrl+C to stop the server
echo.

npm run dev
pause
