#!/bin/bash

# Script to restart Docker services with fixes applied
# This script rebuilds the backend service and restarts all services

echo "🔧 Stopping all services..."
cd docker
docker-compose down

echo "🏗️  Rebuilding backend service with DNS fix..."
docker-compose build --no-cache backend

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Services restarted!"
echo ""
echo "📝 Next steps:"
echo "1. Create test users in Supabase Dashboard (see DOCUMENT_UPLOAD_AND_LOGIN_FIXES.md)"
echo "2. Test login at http://localhost:3000/login"
echo "3. Test document upload at http://localhost:3000/patient/documents"
echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f backend"
