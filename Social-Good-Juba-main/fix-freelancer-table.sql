-- Fix freelancer_profiles table by adding missing columns
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to freelancer_profiles table
ALTER TABLE freelancer_profiles 
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- 2. Verify the table structure after changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 3. Check if there are any existing records that need the new columns
SELECT COUNT(*) as total_records FROM freelancer_profiles;

-- 4. Show sample of existing records
SELECT * FROM freelancer_profiles LIMIT 3;

-- 5. Verify foreign key relationships
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
