#!/bin/bash

# Quick script to create test users

echo "🚀 Creating test users in Supabase..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Using Python..."
    pip3 install supabase python-dotenv > /dev/null 2>&1
    python3 scripts/create-test-users.py
    exit 0
fi

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Using Node.js..."
    npm install @supabase/supabase-js dotenv > /dev/null 2>&1
    node scripts/create-test-users.js
    exit 0
fi

echo "❌ Error: Neither Python nor Node.js found!"
echo "Please install Python or Node.js to run this script."
echo ""
echo "Or create users manually via Supabase Dashboard:"
echo "https://supabase.com/dashboard"
