# Admin Account Setup Guide

## Overview
The Juba Platform supports multiple ways to create and manage admin accounts. This guide covers all the available methods.

## Method 1: Environment Variable Setup (Recommended for Production)

### Step 1: Create/Update Environment File
Create a `.env` file in the root directory (`Social-Good-Juba-main/`) with these variables:

```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL_DOMAIN=@yourdomain.com
PORT=5000
```

### Step 2: Sign Up with Admin Domain
Any user who signs up with an email ending in `@yourdomain.com` will automatically be granted admin status.

**Example:** If you set `ADMIN_EMAIL_DOMAIN=@jubaplatform.com`, then `admin@jubaplatform.com` will automatically become an admin.

## Method 2: Direct Database Update (Quick Setup)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from `create-admin.sql`

### Step 2: Update Existing User
```sql
UPDATE users 
SET admin_status = true 
WHERE email = 'your-email@example.com';
```

### Step 3: Create New Admin User
```sql
INSERT INTO users (
    id, google_id, email, phone, address, role, admin_status, 
    profile_completion_status, verification_status, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'admin_' || extract(epoch from now())::text,
    'admin@jubaplatform.com',
    '+27123456789',
    'Johannesburg, South Africa',
    'client',
    true,
    true,
    true,
    now(),
    now()
);
```

## Method 3: Using the Admin Dashboard (Requires Existing Admin)

### Step 1: Access Admin Dashboard
1. Log in with an existing admin account
2. Navigate to `/admin` in your application
3. Click the "Create Admin" button in the Quick Actions section

### Step 2: Fill Out the Form
- **Email:** The email address for the new admin
- **Phone:** Contact phone number
- **Address:** Physical address

### Step 3: Submit
The system will create the admin account and send a welcome email.

## Method 4: API Endpoint (For Developers)

### Endpoint
```
POST /api/users/admin/create-admin
```

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "email": "newadmin@example.com",
  "phone": "+27123456789",
  "address": "Johannesburg, South Africa"
}
```

### Response
```json
{
  "message": "Admin user created successfully",
  "admin": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "admin_status": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Admin Privileges

Once a user has admin status, they can:

### Dashboard Access
- View platform statistics
- Monitor user activity
- Review freelancer applications
- Manage user accounts

### User Management
- View all registered users
- Update user information
- Delete user accounts
- Grant/revoke admin status

### Application Review
- Review freelancer applications
- Approve or reject applications
- Provide feedback to applicants
- Monitor application status

### Platform Monitoring
- Track job postings
- Monitor platform health
- View system statistics
- Access admin logs

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique values for secrets
- Rotate secrets regularly in production

### Admin Access
- Limit admin accounts to trusted personnel
- Use strong passwords for admin accounts
- Monitor admin activity logs
- Implement two-factor authentication if possible

### Database Security
- Use Row Level Security (RLS) policies
- Limit direct database access
- Regular security audits
- Backup admin accounts

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Check if user has `admin_status: true`
   - Verify JWT token is valid
   - Check if admin middleware is working

2. **Admin Creation Fails**
   - Verify email is unique
   - Check required fields are provided
   - Ensure database connection is working

3. **Admin Dashboard Not Loading**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check if user is properly authenticated

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check server logs for backend errors
4. Verify database connection and permissions
5. Test API endpoints with tools like Postman

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review server logs for backend errors
3. Verify your environment configuration
4. Test with the provided SQL scripts
5. Contact the development team with specific error details

## Quick Start Checklist

- [ ] Create `.env` file with required variables
- [ ] Set `ADMIN_EMAIL_DOMAIN` to your desired domain
- [ ] Sign up with an email from that domain
- [ ] Verify admin access to `/admin` route
- [ ] Test admin dashboard functionality
- [ ] Create additional admin accounts if needed
- [ ] Configure admin email notifications
- [ ] Set up admin activity monitoring
