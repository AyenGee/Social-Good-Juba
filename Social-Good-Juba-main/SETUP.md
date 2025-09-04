# Environment Setup Guide

## Required Environment Variables

To run this project, you need to create a `.env` file in the root directory with the following variables:

### Supabase Configuration (Required)
```
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Server Configuration (Optional)
```
PORT=5000
```

### Google OAuth (Optional)
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Payment Gateway (Optional)
```
PAYMENT_API_KEY=your_payment_api_key_here
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Project Settings > API
4. Copy the "Project URL" and "anon public" key
5. Paste them in your `.env` file

## Steps to Create .env File

1. In the root directory of this project, create a new file called `.env`
2. Copy the template above and replace the placeholder values with your actual credentials
3. Save the file
4. Restart your development server

## Example .env File
```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=5000
```

**Note**: Never commit your `.env` file to version control as it contains sensitive information!

