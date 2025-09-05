-- Fix Profile Schema - Add Missing Fields
-- Run this in your Supabase SQL Editor

-- 1. Add missing fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('high_school', 'diploma', 'bachelor', 'master', 'phd', 'other')),
ADD COLUMN IF NOT EXISTS employment_status TEXT CHECK (employment_status IN ('employed', 'unemployed', 'self_employed', 'student', 'retired', 'other')),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Create unique index on username if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3. Add missing fields to freelancer_profiles table
ALTER TABLE freelancer_profiles 
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS transportation_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_coverage BOOLEAN DEFAULT FALSE;

-- 4. Update existing users with default usernames if they don't have one
UPDATE users 
SET username = CASE 
    WHEN email LIKE '%@%' THEN 
        'User_' || split_part(email, '@', 1) || '_' || floor(random() * 1000)::text
    ELSE 'User_' || floor(random() * 1000)::text
END
WHERE username IS NULL;

-- 5. Make username NOT NULL after populating
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

-- 6. Verify the changes
SELECT 
    id,
    email,
    username,
    first_name,
    last_name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check freelancer_profiles structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 8. Check for any duplicate usernames (should be 0)
SELECT username, COUNT(*) as count
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;
