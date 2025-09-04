-- Check and Fix job_applications Table
-- This script will check the table structure and add missing columns

-- Step 1: Check current table structure
SELECT '=== CHECKING job_applications TABLE ===' as info;

-- Check if table exists
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name = 'job_applications'
AND table_schema = 'public';

-- Check current columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'job_applications'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if feedback column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'job_applications' 
            AND column_name = 'feedback'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as feedback_column_status;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN feedback TEXT;
        RAISE NOTICE 'Added feedback column to job_applications table';
    ELSE
        RAISE NOTICE 'feedback column already exists';
    END IF;
    
    -- Add created_at column if it doesn't exist (for consistency)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to job_applications table';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Step 3: Check current data
SELECT '=== CHECKING CURRENT DATA ===' as info;

-- Count applications
SELECT 
    'job_applications' as table_name,
    COUNT(*) as record_count
FROM job_applications;

-- Show sample applications
SELECT 
    id,
    job_id,
    freelancer_id,
    proposed_rate,
    status,
    application_timestamp,
    created_at,
    feedback
FROM job_applications 
LIMIT 5;

-- Step 4: Check foreign key relationships
SELECT '=== CHECKING FOREIGN KEYS ===' as info;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'job_applications';

-- Step 5: Test the relationships
SELECT '=== TESTING RELATIONSHIPS ===' as info;

-- Test joining with jobs and users
SELECT 
    ja.id,
    ja.job_id,
    ja.freelancer_id,
    ja.status,
    j.title as job_title,
    u.email as client_email
FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.id
LEFT JOIN users u ON j.client_id = u.id
LIMIT 5;

-- Step 6: Show final table structure
SELECT '=== FINAL TABLE STRUCTURE ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'job_applications'
AND table_schema = 'public'
ORDER BY ordinal_position;
