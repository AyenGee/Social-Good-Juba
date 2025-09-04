-- Check if freelancer_profiles table exists and has correct structure
-- Run this in your Supabase SQL Editor

-- 1. Check if table exists
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

-- 4. Show sample records
SELECT * FROM freelancer_profiles LIMIT 5;

-- 5. Check foreign key relationship
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
    AND tc.table_name = 'freelancer_profiles';

-- 6. Check if the table has the required columns for the admin panel
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'id') THEN '✓ id exists'
        ELSE '✗ id missing'
    END as id_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'user_id') THEN '✓ user_id exists'
        ELSE '✗ user_id missing'
    END as user_id_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'approval_status') THEN '✓ approval_status exists'
        ELSE '✗ approval_status missing'
    END as approval_status_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'bio') THEN '✓ bio exists'
        ELSE '✗ bio missing'
    END as bio_check;
