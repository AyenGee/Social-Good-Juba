# Profile Functionality Debug Guide

## Current Issues Identified

The profile functionality is not working due to several potential issues:

1. **Database RLS Policies**: Row Level Security policies may not be properly configured
2. **Authentication Issues**: Token validation or user ID mapping problems
3. **Database Connection**: Supabase connection or service role key issues
4. **Missing Environment Variables**: Required environment variables not set

## Step-by-Step Fix Process

### Step 1: Run Database Fix Script

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-profile-complete.sql`
4. Run the SQL script
5. Check the output for any errors

### Step 2: Verify Environment Variables

Make sure your `.env` file contains:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 3: Test the API Endpoints

1. Start your server: `npm start`
2. Run the test script: `node test-profile-api.js`
3. Check the console output for any errors

### Step 4: Check Server Logs

When you try to access the profile page, check your server console for:

- Authentication errors
- Database connection errors
- RLS policy violations
- Missing user data

### Step 5: Test with Browser Developer Tools

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Try to access the profile page
4. Look for failed API requests to `/api/profile`
5. Check the response status and error messages

## Common Issues and Solutions

### Issue 1: "Access token required" Error

**Cause**: User is not authenticated or token is missing
**Solution**: 
- Make sure user is logged in
- Check if token is stored in localStorage
- Verify JWT_SECRET is set correctly

### Issue 2: "Invalid or expired token" Error

**Cause**: JWT token is invalid or expired
**Solution**:
- User needs to log in again
- Check JWT_SECRET configuration
- Verify token generation in auth middleware

### Issue 3: "User not found" Error

**Cause**: User ID from token doesn't exist in database
**Solution**:
- Check if user exists in users table
- Verify user ID mapping in JWT token
- Check RLS policies

### Issue 4: "Internal server error" Error

**Cause**: Database connection or query issues
**Solution**:
- Check Supabase connection
- Verify service role key
- Check RLS policies
- Look at server logs for specific errors

### Issue 5: Profile page loads but shows "Loading profile..." forever

**Cause**: API request is hanging or failing silently
**Solution**:
- Check browser console for JavaScript errors
- Check network tab for failed requests
- Verify server is running and accessible

## Debugging Commands

### Check if server is running:
```bash
curl http://localhost:5000/health
```

### Test profile endpoint (replace TOKEN with actual token):
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/profile
```

### Check database connection:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM freelancer_profiles;
```

## Expected Behavior After Fix

1. **Profile page loads** without showing "Loading profile..." forever
2. **Form fields populate** with existing user data
3. **Form submission works** and shows success message
4. **File uploads work** for freelancers (CV, Police Clearance)
5. **Profile data persists** after page refresh

## If Issues Persist

If the profile functionality still doesn't work after following this guide:

1. **Check server logs** for specific error messages
2. **Verify database schema** matches the expected structure
3. **Test with a fresh user account** to rule out data issues
4. **Check browser console** for client-side errors
5. **Verify all environment variables** are set correctly

## Files Modified in This Fix

- `server/routes/profile.js` - Added debugging logs
- `fix-profile-complete.sql` - Database RLS policy fixes
- `test-profile-api.js` - API endpoint testing script

The profile functionality should work correctly after applying these fixes and following the debugging steps.
