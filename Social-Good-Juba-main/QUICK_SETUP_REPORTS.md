# Quick Setup: Reports System

## The Error You're Seeing
The error `column "created_at" does not exist` occurs because the `reports` table doesn't exist yet, but the admin dashboard is trying to fetch reports.

## Quick Fix

### Step 1: Create the Reports Table
Copy and paste this SQL into your **Supabase SQL Editor**:

```sql
-- Create reports table for user reporting system
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('inappropriate_behavior', 'spam', 'fraud', 'harassment', 'fake_profile', 'other')),
    description TEXT NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    chat_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );

CREATE POLICY "Admins can update report status" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );
```

### Step 2: Restart Your Server
```bash
# Stop your server (Ctrl+C) and restart it
npm start
```

### Step 3: Test
1. Go to the admin dashboard
2. The error should be gone
3. Try the Reports tab (it will be empty until someone submits a report)
4. Try the All Chats tab to see conversations

## What This Fixes
- ✅ Eliminates the `created_at` column error
- ✅ Enables the reporting system
- ✅ Allows admin to view all reports and chats
- ✅ Makes the admin dashboard fully functional

## Alternative: Skip Reports for Now
If you don't want to set up reports right now, the admin dashboard will still work for:
- User management
- Freelancer verification
- Viewing conversations
- All other admin functions

The reports system is optional and can be added later.
