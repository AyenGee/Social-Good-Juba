-- Test and Create Sample Job Data
-- This script will help verify that jobs are working correctly

-- First, let's check what's in the database
SELECT '=== DATABASE STATUS ===' as info;

-- Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('users', 'jobs', 'job_applications', 'freelancer_profiles')
AND table_schema = 'public';

-- Check if there are any users
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users;

-- Check if there are any jobs
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs;

-- Check if there are any freelancer profiles
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles;

-- Show sample user data (if any exists)
SELECT 
    id,
    email,
    role,
    admin_status,
    created_at
FROM users 
LIMIT 5;

-- Show sample job data (if any exists)
SELECT 
    id,
    title,
    description,
    location,
    status,
    client_id,
    created_at
FROM jobs 
LIMIT 5;

-- If no jobs exist, let's create some sample data
-- First, check if we have users to work with
DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Please create users first.';
        RETURN;
    END IF;
    
    -- Get a sample user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Check if jobs exist
    IF NOT EXISTS (SELECT 1 FROM jobs LIMIT 1) THEN
        -- Create sample jobs
        INSERT INTO jobs (client_id, title, description, location, status, timeline) VALUES
        (sample_user_id, 'Website Development', 'Need a professional website for my business. Looking for modern design with e-commerce functionality.', 'Johannesburg', 'posted', '2-3 weeks'),
        (sample_user_id, 'Mobile App Development', 'Looking for an iOS developer to create a fitness tracking app with social features.', 'Cape Town', 'posted', '4-6 weeks'),
        (sample_user_id, 'Logo Design', 'Need a creative logo design for my startup company. Should be modern and memorable.', 'Durban', 'posted', '1 week'),
        (sample_user_id, 'Content Writing', 'Looking for a content writer to create blog posts and marketing copy for my website.', 'Pretoria', 'posted', 'Ongoing'),
        (sample_user_id, 'Graphic Design', 'Need a graphic designer to create marketing materials including flyers, social media posts, and business cards.', 'Port Elizabeth', 'posted', '2 weeks');
        
        RAISE NOTICE 'Created 5 sample jobs for user %', sample_user_id;
    ELSE
        RAISE NOTICE 'Jobs already exist in the database.';
    END IF;
    
    -- Check if freelancer profiles exist
    IF NOT EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1) THEN
        -- Create sample freelancer profile
        INSERT INTO freelancer_profiles (user_id, bio, experience_years, service_areas, hourly_rate_min, hourly_rate_max, approval_status) VALUES
        (sample_user_id, 'Experienced web developer with 5+ years in creating modern, responsive websites and web applications.', 5, ARRAY['Web Development', 'Frontend Development', 'Backend Development'], 150.00, 250.00, 'approved');
        
        RAISE NOTICE 'Created sample freelancer profile for user %', sample_user_id;
    ELSE
        RAISE NOTICE 'Freelancer profiles already exist in the database.';
    END IF;
    
END $$;

-- Now let's verify the data was created
SELECT '=== AFTER CREATING SAMPLE DATA ===' as info;

-- Check jobs again
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs;

-- Show the created jobs
SELECT 
    id,
    title,
    description,
    location,
    status,
    created_at
FROM jobs 
ORDER BY created_at DESC;

-- Check freelancer profiles
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles;

-- Show the created profile
SELECT 
    id,
    user_id,
    bio,
    experience_years,
    service_areas,
    hourly_rate_min,
    hourly_rate_max,
    approval_status
FROM freelancer_profiles;

-- Test the relationships
SELECT 
    '=== RELATIONSHIP TEST ===' as info;

-- Test jobs with client info
SELECT 
    j.id,
    j.title,
    j.status,
    u.email as client_email,
    j.created_at
FROM jobs j
JOIN users u ON j.client_id = u.id
ORDER BY j.created_at DESC;

-- Test freelancer profile with user info
SELECT 
    fp.id,
    fp.bio,
    fp.experience_years,
    fp.service_areas,
    u.email as user_email,
    fp.approval_status
FROM freelancer_profiles fp
JOIN users u ON fp.user_id = u.id;
