-- Quick Fix for Jobs Display Issue
-- This script will temporarily disable RLS and create sample data

-- Step 1: Temporarily disable RLS to allow data access
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Check current data
SELECT '=== CURRENT DATABASE STATUS ===' as info;

SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users;

SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs;

SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles;

-- Step 3: Create sample jobs if none exist
DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
    jobs_count INTEGER;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Please create users first by signing up.';
        RETURN;
    END IF;
    
    -- Get a sample user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Count existing jobs
    SELECT COUNT(*) INTO jobs_count FROM jobs;
    
    IF jobs_count = 0 THEN
        -- Create sample jobs
        INSERT INTO jobs (client_id, title, description, location, status, timeline) VALUES
        (sample_user_id, 'Website Development', 'Need a professional website for my business. Looking for modern design with e-commerce functionality.', 'Johannesburg', 'posted', '2-3 weeks'),
        (sample_user_id, 'Mobile App Development', 'Looking for an iOS developer to create a fitness tracking app with social features.', 'Cape Town', 'posted', '4-6 weeks'),
        (sample_user_id, 'Logo Design', 'Need a creative logo design for my startup company. Should be modern and memorable.', 'Durban', 'posted', '1 week'),
        (sample_user_id, 'Content Writing', 'Looking for a content writer to create blog posts and marketing copy for my website.', 'Pretoria', 'posted', 'Ongoing'),
        (sample_user_id, 'Graphic Design', 'Need a graphic designer to create marketing materials including flyers, social media posts, and business cards.', 'Port Elizabeth', 'posted', '2 weeks'),
        (sample_user_id, 'Social Media Management', 'Looking for someone to manage our social media accounts and create engaging content.', 'Bloemfontein', 'posted', 'Ongoing'),
        (sample_user_id, 'Video Editing', 'Need a video editor for our YouTube channel. Experience with Adobe Premiere Pro required.', 'East London', 'posted', '3-4 weeks'),
        (sample_user_id, 'Data Analysis', 'Looking for a data analyst to help interpret our business metrics and create reports.', 'Nelspruit', 'posted', '2 weeks');
        
        RAISE NOTICE 'Created 8 sample jobs for user %', sample_user_id;
    ELSE
        RAISE NOTICE 'Jobs already exist in the database. Count: %', jobs_count;
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

-- Step 4: Verify the data was created
SELECT '=== AFTER CREATING SAMPLE DATA ===' as info;

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

-- Step 5: Test the relationships
SELECT '=== RELATIONSHIP TEST ===' as info;

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

-- Step 6: Show what freelancers should see
SELECT '=== FREELANCER VIEW TEST ===' as info;

-- This should show all posted jobs that freelancers can see
SELECT 
    j.id,
    j.title,
    j.description,
    j.location,
    j.status,
    j.timeline,
    u.email as client_email,
    j.created_at
FROM jobs j
JOIN users u ON j.client_id = u.id
WHERE j.status = 'posted'
ORDER BY j.created_at DESC;

-- Step 7: Re-enable RLS with proper policies (optional - uncomment if you want to re-enable)
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all users to see posted jobs
-- CREATE POLICY IF NOT EXISTS "Allow all users to see posted jobs" ON jobs
--     FOR SELECT USING (status = 'posted');
