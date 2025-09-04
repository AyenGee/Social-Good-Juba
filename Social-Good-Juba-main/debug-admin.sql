-- Debug SQL Script for Admin Panel Issues
-- Run this in your Supabase SQL Editor to diagnose problems

-- 1. Check if users table has the right structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check if freelancer_profiles table has the right structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 3. Check if there are any users
SELECT COUNT(*) as total_users FROM users;

-- 4. Check if there are any freelancer profiles
SELECT COUNT(*) as total_freelancer_profiles FROM freelancer_profiles;

-- 5. Check users with their freelancer profiles (if any)
SELECT 
    u.id,
    u.email,
    u.admin_status,
    u.created_at,
    fp.id as profile_id,
    fp.approval_status,
    fp.created_at as profile_created
FROM users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
ORDER BY u.created_at DESC;

-- 6. Check if there are any admin users
SELECT 
    id, 
    email, 
    admin_status, 
    created_at
FROM users 
WHERE admin_status = true;

-- 7. Check freelancer profiles with user information
SELECT 
    fp.id,
    fp.user_id,
    fp.approval_status,
    fp.created_at,
    u.email,
    u.admin_status
FROM freelancer_profiles fp
JOIN users u ON fp.user_id = u.id
ORDER BY fp.created_at DESC;

-- 8. Check for any foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('users', 'freelancer_profiles');
