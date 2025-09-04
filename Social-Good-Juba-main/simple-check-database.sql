-- Simple Database Check Script
-- Run this in your Supabase SQL Editor FIRST

-- 1. Check if freelancer_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'freelancer_profiles'
) as table_exists;

-- 2. If table exists, show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 3. Check if there are any records
SELECT COUNT(*) as total_records FROM freelancer_profiles;

-- 4. Show sample records (if any exist)
SELECT * FROM freelancer_profiles LIMIT 5;

-- 5. Check if there are any users
SELECT COUNT(*) as total_users FROM users;

-- 6. Show sample users
SELECT id, email, admin_status, role FROM users LIMIT 5;

-- 7. Check if there are any users with freelancer profiles
SELECT 
    u.id,
    u.email,
    u.role,
    fp.id as profile_id,
    fp.approval_status,
    fp.created_at as profile_created
FROM users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
LIMIT 10;
