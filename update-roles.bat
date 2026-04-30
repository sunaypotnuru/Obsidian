@echo off
REM Update existing user roles

echo 🔧 Updating user roles in Supabase...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python...
    pip install supabase python-dotenv >nul 2>&1
    python scripts/update-user-roles.py
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js...
    npm install @supabase/supabase-js dotenv >nul 2>&1
    node scripts/update-user-roles.js
    goto :end
)

echo ❌ Error: Neither Python nor Node.js found!
echo Please install Python or Node.js to run this script.

:end
pause
