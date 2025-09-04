-- Remove Approval System from Freelancer Profiles
-- This script removes the approval-related columns and updates existing profiles

-- 1. Update all existing profiles to be approved
UPDATE freelancer_profiles 
SET approval_status = 'approved' 
WHERE approval_status IN ('pending', 'rejected');

-- 2. Remove approval-related columns (optional - only if you want to clean up the schema)
-- ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS approval_status;
-- ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS feedback;
-- ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS reviewed_at;
-- ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS reviewed_by;

-- 3. Verify the changes
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_profiles
FROM freelancer_profiles;

-- 4. Show sample profiles
SELECT 
    id,
    user_id,
    bio,
    experience_years,
    service_areas,
    hourly_rate_min,
    hourly_rate_max,
    created_at
FROM freelancer_profiles 
LIMIT 5;
