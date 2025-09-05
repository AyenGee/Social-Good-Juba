# Quick Profile Fix - Step by Step

## The Problem
The profile page shows "Loading Profile..." forever because the server isn't running due to missing environment variables.

## Step 1: Create .env File

Create a file called `.env` in the `Social-Good-Juba-main` folder with these contents:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here

# Server Configuration
PORT=5000
```

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the "Project URL" and paste it as `SUPABASE_URL`
4. Copy the "service_role" key and paste it as `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Set JWT Secret

Generate a random JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it as `JWT_SECRET`

## Step 4: Get Google Client ID

1. Go to Google Cloud Console
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Copy the Client ID and use it as `GOOGLE_CLIENT_ID`

## Step 5: Start the Server

```bash
cd Social-Good-Juba-main
npm start
```

You should see: `Server running on port 5000`

## Step 6: Start the Client

In a new terminal:
```bash
cd Social-Good-Juba-main/client
npm start
```

## Step 7: Test the Profile

1. Open your browser to `http://localhost:3000`
2. Log in with Google
3. Click on Profile
4. The profile should now load properly

## If Profile Still Shows "Loading Profile..."

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Go to Network tab
5. Try to access profile again
6. Look for failed requests to `/api/profile`

## Common Issues:

### "Missing Supabase configuration" error
- Check your .env file exists and has the correct values
- Make sure there are no spaces around the = sign

### "Invalid token" error
- User needs to log in again
- Check JWT_SECRET is set correctly

### "User not found" error
- Run the database fix script: `fix-profile-complete.sql`
- Check if user exists in the database

### Server won't start
- Make sure all dependencies are installed: `npm install`
- Check if port 5000 is already in use

## Quick Test Commands:

```bash
# Test if server is running
curl http://localhost:5000/health

# Test profile endpoint (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/profile
```

The profile should work after completing these steps!
