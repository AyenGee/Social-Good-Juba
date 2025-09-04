@echo off
echo 🔔 Setting up Notifications System...

REM Check if we're in the right directory
if not exist "setup-notifications-system.sql" (
    echo ❌ Error: setup-notifications-system.sql not found. Please run this script from the Social-Good-Juba-main directory.
    pause
    exit /b 1
)

echo 📊 Database migration file created successfully!
echo.
echo 🚀 Notification system setup complete!
echo.
echo 📋 What was set up:
echo    ✅ Notifications database table with triggers
echo    ✅ Real-time notification system via Socket.IO
echo    ✅ Frontend notification components
echo    ✅ API endpoints for notification management
echo.
echo 🔔 Notification types supported:
echo    • New job postings → Freelancers
echo    • Job applications → Clients
echo    • Application approval/rejection → Freelancers
echo    • Job completion → Both parties
echo.
echo 📱 Features:
echo    • Real-time notifications via Socket.IO
echo    • Browser push notifications
echo    • In-app notification bell with unread count
echo    • Full notifications page with filtering
echo    • Mark as read/unread functionality
echo.
echo 🎯 Next steps:
echo    1. Run the SQL migration in your Supabase dashboard
echo    2. Start your server: npm start (in server directory)
echo    3. Start your client: npm start (in client directory)
echo    4. Test by posting a job or applying to a job
echo.
echo 💡 The notification system will automatically:
echo    • Notify freelancers when new jobs are posted
echo    • Notify clients when freelancers apply to their jobs
echo    • Notify freelancers when their applications are approved/rejected
echo    • Notify both parties when jobs are completed
echo.
pause
