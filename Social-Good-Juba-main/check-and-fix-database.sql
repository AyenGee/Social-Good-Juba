-- Comprehensive Database Check and Fix Script
-- Run this in your Supabase SQL Editor

-- 1. Check if freelancer_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'freelancer_profiles'
) as table_exists;

-- 2. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INTEGER,
    service_areas TEXT[], -- Array of text
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    certifications TEXT[], -- Array of text
    coverage_areas TEXT[], -- Array of text
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns if they don't exist
ALTER TABLE freelancer_profiles 
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- 4. Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 5. Check if there are any records
SELECT COUNT(*) as total_records FROM freelancer_profiles;

-- 6. Show sample records
SELECT * FROM freelancer_profiles LIMIT 5;

-- 7. Check if there are any users
SELECT COUNT(*) as total_users FROM users;

-- 8. Show sample users
SELECT id, email, admin_status, role FROM users LIMIT 5;

-- 9. Check if there are any users with freelancer profiles
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

-- 10. Create a test freelancer profile if none exist
INSERT INTO freelancer_profiles (
    user_id,
    bio,
    experience_years,
    service_areas,
    hourly_rate_min,
    hourly_rate_max,
    certifications,
    coverage_areas,
    approval_status
) 
SELECT 
    u.id,
    'Test freelancer profile for ' || u.email,
    2,
    ARRAY['Web Development', 'Mobile Apps'],
    50.00,
    100.00,
    ARRAY['React', 'Node.js', 'Python'],
    ARRAY['Johannesburg', 'Cape Town'],
    'pending'
FROM users u
WHERE u.admin_status = false 
AND u.id NOT IN (SELECT user_id FROM freelancer_profiles)
LIMIT 1;

-- 11. Verify the test profile was created
SELECT 
    fp.*,
    u.email
FROM freelancer_profiles fp
JOIN users u ON fp.user_id = u.id
ORDER BY fp.created_at DESC
LIMIT 5;
