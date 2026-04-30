#!/bin/bash

# Update existing user roles

echo "🔧 Updating user roles in Supabase..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Using Python..."
    pip3 install supabase python-dotenv > /dev/null 2>&1
    python3 scripts/update-user-roles.py
    exit 0
fi

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Using Node.js..."
    npm install @supabase/supabase-js dotenv > /dev/null 2>&1
    node scripts/update-user-roles.js
    exit 0
fi

echo "❌ Error: Neither Python nor Node.js found!"
echo "Please install Python or Node.js to run this script."
