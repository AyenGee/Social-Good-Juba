# 🔔 Notification System Guide

This guide explains the comprehensive notification system implemented for the Juba platform, which provides real-time notifications for job postings and applications.

## 📋 Overview

The notification system automatically notifies users about important events in the platform:

- **Freelancers** receive notifications when new jobs are posted
- **Clients** receive notifications when freelancers apply to their jobs
- **Freelancers** receive notifications when their applications are approved or rejected
- **Both parties** receive notifications when jobs are completed

## 🏗️ Architecture

### Backend Components

1. **Database Schema** (`setup-notifications-system.sql`)
   - `notifications` table for storing notification data
   - Database triggers for automatic notification creation
   - Functions for notification management

2. **Notification Service** (`server/services/notificationService.js`)
   - Core notification logic
   - Real-time delivery via Socket.IO
   - Integration with existing job and application flows

3. **API Routes** (`server/routes/notifications.js`)
   - REST endpoints for notification management
   - CRUD operations for notifications
   - Unread count tracking

4. **Socket.IO Integration** (`server/index.js`)
   - Real-time notification delivery
   - User-specific notification rooms
   - Connection management

### Frontend Components

1. **Notification Context** (`client/src/context/NotificationContext.js`)
   - Global notification state management
   - Socket.IO client integration
   - Browser notification support

2. **UI Components**
   - `NotificationBell.js` - Notification bell with unread count
   - `NotificationDropdown.js` - Dropdown with recent notifications
   - `NotificationItem.js` - Individual notification display
   - `Notifications.js` - Full notifications page

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase dashboard:

```sql
-- Copy and paste the contents of setup-notifications-system.sql
-- into your Supabase SQL editor and execute
```

### 2. Backend Setup

The notification system is already integrated into the existing routes. No additional setup required.

### 3. Frontend Setup

Install the required dependency:

```bash
cd client
npm install socket.io-client
```

### 4. Environment Variables

Ensure your environment variables are set:

```env
# Server
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

# Database
DATABASE_URL=your_supabase_database_url
```

## 🔔 Notification Types

### 1. Job Posted (`job_posted`)
- **Triggered when**: A client posts a new job
- **Recipients**: All approved freelancers
- **Message**: "A new job '[Job Title]' has been posted in [Location]"

### 2. Job Application (`job_application`)
- **Triggered when**: A freelancer applies to a job
- **Recipients**: The job owner (client)
- **Message**: "[Freelancer Email] has applied for your job '[Job Title]'"

### 3. Application Approved (`application_approved`)
- **Triggered when**: A client approves a freelancer's application
- **Recipients**: The freelancer whose application was approved
- **Message**: "Your application for '[Job Title]' has been approved by [Client Email]"

### 4. Application Rejected (`application_rejected`)
- **Triggered when**: A client rejects a freelancer's application
- **Recipients**: The freelancer whose application was rejected
- **Message**: "Your application for '[Job Title]' was not selected this time"

### 5. Job Completed (`job_completed`)
- **Triggered when**: A client marks a job as completed
- **Recipients**: Both the client and the selected freelancer
- **Message**: "The job '[Job Title]' has been marked as completed"

## 📱 Features

### Real-time Notifications
- Instant delivery via Socket.IO
- No page refresh required
- Live unread count updates

### Browser Notifications
- Native browser notifications
- Permission-based (user must grant permission)
- Click to navigate to relevant page

### In-app Notifications
- Notification bell in header with unread count
- Dropdown with recent notifications
- Full notifications page with filtering

### Notification Management
- Mark individual notifications as read
- Mark all notifications as read
- Delete individual notifications
- Clear all notifications
- Filter by read/unread status

## 🎯 Usage Examples

### For Freelancers

1. **Receiving Job Notifications**
   ```javascript
   // Automatically triggered when a client posts a job
   // Notification appears in real-time
   // Click to view job details
   ```

2. **Application Status Updates**
   ```javascript
   // Get notified when application is approved/rejected
   // Navigate directly to job page
   ```

### For Clients

1. **Application Notifications**
   ```javascript
   // Get notified when freelancers apply
   // Click to view application details
   ```

2. **Job Completion**
   ```javascript
   // Get notified when job is marked complete
   // Navigate to job details for review
   ```

## 🔧 API Endpoints

### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unread_only=false
```

### Get Unread Count
```http
GET /api/notifications/unread-count
```

### Mark as Read
```http
PUT /api/notifications/mark-read
Content-Type: application/json

{
  "notification_ids": ["uuid1", "uuid2"] // Optional, marks all if not provided
}
```

### Mark All as Read
```http
PUT /api/notifications/mark-all-read
```

### Delete Notification
```http
DELETE /api/notifications/:id
```

### Clear All Notifications
```http
DELETE /api/notifications
```

## 🧪 Testing

### Manual Testing

1. **Test Job Posting Notifications**
   - Post a job as a client
   - Check that freelancers receive notifications
   - Verify notification content and links

2. **Test Application Notifications**
   - Apply to a job as a freelancer
   - Check that the client receives a notification
   - Verify notification content and links

3. **Test Application Status Notifications**
   - Approve/reject an application as a client
   - Check that the freelancer receives a notification
   - Verify notification content and links

4. **Test Job Completion Notifications**
   - Mark a job as completed as a client
   - Check that both parties receive notifications
   - Verify notification content and links

### Automated Testing

The notification system integrates with existing job and application flows, so existing tests should cover the functionality.

## 🐛 Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check Socket.IO connection
   - Verify database triggers are active
   - Check browser console for errors

2. **Real-time updates not working**
   - Verify Socket.IO server is running
   - Check network connectivity
   - Ensure user is in correct notification room

3. **Browser notifications not showing**
   - Check notification permission
   - Verify browser supports notifications
   - Check if notifications are blocked

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'notifications');
```

## 🔮 Future Enhancements

### Planned Features

1. **Email Notifications**
   - Fallback for users not online
   - Digest emails for multiple notifications
   - Customizable notification preferences

2. **Push Notifications**
   - Mobile app integration
   - Service worker implementation
   - Offline notification support

3. **Notification Preferences**
   - User-configurable notification types
   - Frequency settings (immediate, daily, weekly)
   - Channel preferences (in-app, email, push)

4. **Advanced Filtering**
   - Filter by notification type
   - Date range filtering
   - Search functionality

5. **Notification Analytics**
   - Read rates and engagement metrics
   - User behavior insights
   - Performance monitoring

## 📚 Related Documentation

- [Database Schema](setup-notifications-system.sql)
- [API Documentation](server/routes/notifications.js)
- [Frontend Components](client/src/components/)
- [Socket.IO Integration](server/index.js)

## 🤝 Contributing

When adding new notification types:

1. Add the new type to the database schema
2. Update the notification service
3. Add appropriate triggers
4. Update the frontend components
5. Add tests for the new functionality

## 📄 License

This notification system is part of the Juba platform and follows the same licensing terms.
