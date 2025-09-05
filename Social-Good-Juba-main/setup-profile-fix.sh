#!/bin/bash

echo "========================================"
echo "   Juba Platform - Profile Fix Setup"
echo "========================================"
echo

echo "This script will help you fix the profile functionality."
echo
echo "IMPORTANT: You need to run the SQL migration in Supabase first!"
echo
echo "Steps to complete the fix:"
echo
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of fix-profile-schema.sql"
echo "4. Run the SQL script"
echo "5. Restart your server"
echo
echo "After running the SQL script, press Enter to continue..."
read

echo
echo "Starting the server..."
echo

cd "$(dirname "$0")"
npm start

echo
echo "Server started! The profile functionality should now work correctly."
echo
