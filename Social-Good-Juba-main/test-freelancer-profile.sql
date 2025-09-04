-- Test Freelancer Profile Functionality
-- This script will test the freelancer profile endpoint and create sample data

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as info;

-- Check users
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users;

-- Check freelancer profiles
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles;

-- Check job applications
SELECT 
    'job_applications' as table_name,
    COUNT(*) as record_count
FROM job_applications;

-- Check jobs
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs;

-- Step 2: Show sample data
SELECT '=== SAMPLE DATA ===' as info;

-- Show users
SELECT 
    id,
    email,
    role,
    admin_status
FROM users 
LIMIT 3;

-- Show freelancer profiles
SELECT 
    id,
    user_id,
    bio,
    experience_years,
    approval_status
FROM freelancer_profiles 
LIMIT 3;

-- Show jobs
SELECT 
    id,
    title,
    client_id,
    status
FROM jobs 
LIMIT 3;

-- Show job applications
SELECT 
    id,
    job_id,
    freelancer_id,
    status
FROM job_applications 
LIMIT 3;

-- Step 3: Create sample freelancer profile if none exists
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Count users and profiles
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO profile_count FROM freelancer_profiles;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Please create users first.';
        RETURN;
    END IF;
    
    IF profile_count = 0 THEN
        -- Get a sample user ID
        SELECT id INTO sample_user_id FROM users LIMIT 1;
        
        -- Create sample freelancer profile
        INSERT INTO freelancer_profiles (user_id, bio, experience_years, service_areas, hourly_rate_min, hourly_rate_max, approval_status) VALUES
        (sample_user_id, 'Experienced web developer with 5+ years in creating modern, responsive websites and web applications.', 5, ARRAY['Web Development', 'Frontend Development', 'Backend Development'], 150.00, 250.00, 'approved');
        
        RAISE NOTICE 'Created sample freelancer profile for user %', sample_user_id;
    ELSE
        RAISE NOTICE 'Freelancer profiles already exist. Count: %', profile_count;
    END IF;
END $$;

-- Step 4: Create sample job application if none exists
DO $$
DECLARE
    user_count INTEGER;
    job_count INTEGER;
    app_count INTEGER;
    sample_user_id UUID;
    sample_job_id UUID;
BEGIN
    -- Count data
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO job_count FROM jobs;
    SELECT COUNT(*) INTO app_count FROM job_applications;
    
    IF user_count = 0 OR job_count = 0 THEN
        RAISE NOTICE 'Need users and jobs to create applications.';
        RETURN;
    END IF;
    
    IF app_count = 0 THEN
        -- Get sample user and job IDs
        SELECT id INTO sample_user_id FROM users LIMIT 1;
        SELECT id INTO sample_job_id FROM jobs LIMIT 1;
        
        -- Create sample job application
        INSERT INTO job_applications (job_id, freelancer_id, proposed_rate, status, feedback) VALUES
        (sample_job_id, sample_user_id, 200.00, 'pending', 'I am very interested in this project and have relevant experience.');
        
        RAISE NOTICE 'Created sample job application for job % by user %', sample_job_id, sample_user_id;
    ELSE
        RAISE NOTICE 'Job applications already exist. Count: %', app_count;
    END IF;
END $$;

-- Step 5: Test the relationships that the API needs
SELECT '=== TESTING API RELATIONSHIPS ===' as info;

-- Test freelancer profile query
SELECT 
    'freelancer_profile_test' as test_name,
    fp.id,
    fp.user_id,
    fp.bio,
    fp.approval_status
FROM freelancer_profiles fp
WHERE fp.user_id = (SELECT id FROM users LIMIT 1)
LIMIT 1;

-- Test job applications query
SELECT 
    'job_applications_test' as test_name,
    ja.id,
    ja.job_id,
    ja.freelancer_id,
    ja.status,
    j.title as job_title,
    u.email as client_email
FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.id
LEFT JOIN users u ON j.client_id = u.id
WHERE ja.freelancer_id = (SELECT id FROM users LIMIT 1)
ORDER BY ja.created_at DESC;

-- Step 6: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

-- Count everything again
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles
UNION ALL
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs
UNION ALL
SELECT 
    'job_applications' as table_name,
    COUNT(*) as record_count
FROM job_applications;
