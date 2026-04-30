@echo off
REM Quick script to create test users

echo 🚀 Creating test users in Supabase...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python...
    pip install supabase python-dotenv >nul 2>&1
    python scripts/create-test-users.py
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js...
    npm install @supabase/supabase-js dotenv >nul 2>&1
    node scripts/create-test-users.js
    goto :end
)

echo ❌ Error: Neither Python nor Node.js found!
echo Please install Python or Node.js to run this script.
echo.
echo Or create users manually via Supabase Dashboard:
echo https://supabase.com/dashboard

:end
pause
