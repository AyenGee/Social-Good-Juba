-- Complete Profile Fix - Database Setup
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current state of the tables
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles;

-- 2. Check if RLS is enabled on the tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'freelancer_profiles')
ORDER BY tablename;

-- 3. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON freelancer_profiles;

-- 4. Create proper RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );

-- 5. Create proper RLS policies for freelancer_profiles table
CREATE POLICY "Users can view their own profile" ON freelancer_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON freelancer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON freelancer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON freelancer_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_status = true
        )
    );

-- 6. Verify the policies were created
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
WHERE tablename IN ('users', 'freelancer_profiles')
ORDER BY tablename, policyname;

-- 7. Test data access (this should work if policies are correct)
SELECT 
    'Test users access' as test_name,
    COUNT(*) as accessible_users
FROM users;

-- 8. Show sample user data
SELECT 
    id,
    email,
    username,
    first_name,
    last_name,
    role,
    admin_status,
    created_at
FROM users 
LIMIT 5;

-- 9. Show sample freelancer profile data
SELECT 
    fp.id,
    fp.user_id,
    u.email,
    u.username,
    fp.bio,
    fp.experience_years,
    fp.approval_status,
    fp.created_at
FROM freelancer_profiles fp
JOIN users u ON fp.user_id = u.id
LIMIT 5;

-- 10. If you're still having issues, you can temporarily disable RLS
-- Uncomment the following lines if needed:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;

-- 11. Check if there are any missing columns in users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('username', 'first_name', 'last_name', 'date_of_birth', 'gender', 'education_level', 'employment_status', 'profile_picture_url')
ORDER BY ordinal_position;

-- 12. Check if there are any missing columns in freelancer_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
AND column_name IN ('languages_spoken', 'transportation_available', 'insurance_coverage')
ORDER BY ordinal_position;
