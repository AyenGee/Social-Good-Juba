-- Fix RLS Policies for Jobs and Related Tables
-- This script creates the necessary RLS policies to allow users to access job data

-- First, let's check if the jobs table exists and has data
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS WITH DATA' ELSE 'EXISTS BUT EMPTY' END as status
FROM jobs;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'jobs';

-- Create RLS policies for the jobs table
-- Policy 1: Users can view jobs they posted (as clients)
CREATE POLICY IF NOT EXISTS "Users can view their own jobs" ON jobs
    FOR SELECT USING (auth.uid() = client_id);

-- Policy 2: Users can view all posted jobs (for freelancers to browse)
CREATE POLICY IF NOT EXISTS "Anyone can view posted jobs" ON jobs
    FOR SELECT USING (status = 'posted');

-- Policy 3: Users can insert jobs (create new jobs)
CREATE POLICY IF NOT EXISTS "Users can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Policy 4: Users can update their own jobs
CREATE POLICY IF NOT EXISTS "Users can update their own jobs" ON jobs
    FOR UPDATE USING (auth.uid() = client_id);

-- Policy 5: Users can delete their own jobs
CREATE POLICY IF NOT EXISTS "Users can delete their own jobs" ON jobs
    FOR DELETE USING (auth.uid() = client_id);

-- Create RLS policies for the job_applications table
-- Policy 1: Freelancers can view their own applications
CREATE POLICY IF NOT EXISTS "Freelancers can view their applications" ON job_applications
    FOR SELECT USING (auth.uid() = freelancer_id);

-- Policy 2: Clients can view applications to their jobs
CREATE POLICY IF NOT EXISTS "Clients can view job applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.client_id = auth.uid()
        )
    );

-- Policy 3: Freelancers can create applications
CREATE POLICY IF NOT EXISTS "Freelancers can create applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

-- Policy 4: Clients can update application status
CREATE POLICY IF NOT EXISTS "Clients can update application status" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.client_id = auth.uid()
        )
    );

-- Create RLS policies for the freelancer_profiles table
-- Policy 1: Users can view their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON freelancer_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can create their own profile
CREATE POLICY IF NOT EXISTS "Users can create their own profile" ON freelancer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON freelancer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Admins can view all profiles (for admin dashboard)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON freelancer_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );

-- Create RLS policies for the users table
-- Policy 1: Users can view their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Admins can view all users (for admin dashboard)
CREATE POLICY IF NOT EXISTS "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );

-- Alternative approach: If RLS is causing issues, we can temporarily disable it
-- Uncomment the following lines if you want to disable RLS temporarily:

-- ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('jobs', 'job_applications', 'freelancer_profiles', 'users')
ORDER BY tablename, policyname;

-- Test data access
-- This should return jobs if the policies are working correctly
SELECT 
    'Test jobs access' as test_name,
    COUNT(*) as accessible_jobs
FROM jobs 
WHERE status = 'posted';

-- Show sample job data (if any exists)
SELECT 
    id,
    title,
    description,
    location,
    status,
    created_at
FROM jobs 
LIMIT 5;
