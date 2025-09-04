#!/bin/bash

# Setup Notifications System
# This script sets up the notification system for the Juba platform

echo "🔔 Setting up Notifications System..."

# Check if we're in the right directory
if [ ! -f "setup-notifications-system.sql" ]; then
    echo "❌ Error: setup-notifications-system.sql not found. Please run this script from the Social-Good-Juba-main directory."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase or not in a Supabase project directory."
    echo "   Please run: supabase login"
    echo "   Then: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📊 Running database migration..."

# Run the SQL migration
supabase db reset --db-url "$DATABASE_URL" < setup-notifications-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
else
    echo "❌ Database migration failed. Please check the error messages above."
    exit 1
fi

echo "🔧 Installing additional dependencies..."

# Install socket.io-client if not already installed
if [ -d "client" ]; then
    cd client
    if ! npm list socket.io-client &> /dev/null; then
        echo "📦 Installing socket.io-client..."
        npm install socket.io-client
    fi
    cd ..
fi

echo "🚀 Notification system setup complete!"
echo ""
echo "📋 What was set up:"
echo "   ✅ Notifications database table with triggers"
echo "   ✅ Real-time notification system via Socket.IO"
echo "   ✅ Frontend notification components"
echo "   ✅ API endpoints for notification management"
echo ""
echo "🔔 Notification types supported:"
echo "   • New job postings → Freelancers"
echo "   • Job applications → Clients"
echo "   • Application approval/rejection → Freelancers"
echo "   • Job completion → Both parties"
echo ""
echo "📱 Features:"
echo "   • Real-time notifications via Socket.IO"
echo "   • Browser push notifications"
echo "   • In-app notification bell with unread count"
echo "   • Full notifications page with filtering"
echo "   • Mark as read/unread functionality"
echo ""
echo "🎯 Next steps:"
echo "   1. Start your server: npm start (in server directory)"
echo "   2. Start your client: npm start (in client directory)"
echo "   3. Test by posting a job or applying to a job"
echo ""
echo "💡 The notification system will automatically:"
echo "   • Notify freelancers when new jobs are posted"
echo "   • Notify clients when freelancers apply to their jobs"
echo "   • Notify freelancers when their applications are approved/rejected"
echo "   • Notify both parties when jobs are completed"
