#!/bin/bash

echo "Setting up Reports System for Social Good Juba..."
echo

echo "Step 1: Creating reports table in Supabase..."
echo "Please run the following SQL in your Supabase SQL Editor:"
echo
echo "-- Create reports table for user reporting system"
echo "CREATE TABLE IF NOT EXISTS reports ("
echo "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,"
echo "    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
echo "    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
echo "    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('inappropriate_behavior', 'spam', 'fraud', 'harassment', 'fake_profile', 'other')),"
echo "    description TEXT NOT NULL,"
echo "    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,"
echo "    chat_id UUID REFERENCES conversations(id) ON DELETE SET NULL,"
echo "    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),"
echo "    admin_notes TEXT,"
echo "    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,"
echo "    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
echo "    resolved_at TIMESTAMP WITH TIME ZONE"
echo ");"
echo
echo "-- Create indexes for better performance"
echo "CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);"
echo "CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);"
echo "CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);"
echo "CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);"
echo
echo "-- Enable RLS"
echo "ALTER TABLE reports ENABLE ROW LEVEL SECURITY;"
echo
echo "-- RLS Policies"
echo "CREATE POLICY \"Users can create reports\" ON reports"
echo "    FOR INSERT WITH CHECK (auth.uid() = reporter_id);"
echo
echo "CREATE POLICY \"Users can view their own reports\" ON reports"
echo "    FOR SELECT USING (auth.uid() = reporter_id);"
echo
echo "CREATE POLICY \"Admins can view all reports\" ON reports"
echo "    FOR SELECT USING ("
echo "        EXISTS ("
echo "            SELECT 1 FROM users"
echo "            WHERE users.id = auth.uid()"
echo "            AND users.admin_status = true"
echo "        )"
echo "    );"
echo
echo "CREATE POLICY \"Admins can update report status\" ON reports"
echo "    FOR UPDATE USING ("
echo "        EXISTS ("
echo "            SELECT 1 FROM users"
echo "            WHERE users.id = auth.uid()"
echo "            AND users.admin_status = true"
echo "        )"
echo "    );"
echo
echo "Step 2: Restart your server to load the new routes"
echo
echo "Step 3: Test the reporting system"
echo "- Go to a job details page"
echo "- Click \"Report\" button on freelancer applications"
echo "- Submit a test report"
echo "- Check admin dashboard for the report"
echo
echo "Setup complete! The reporting system is now ready."
