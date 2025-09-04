-- Add Username Field to Users Table
-- Run this in your Supabase SQL Editor

-- 1. Add username column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Create a unique index on username (after we populate it)
-- This will be created after step 3

-- 3. Update existing users with a default username based on their email
-- For now, we'll use a placeholder since we need Google names
-- Users will need to re-authenticate to get their proper Google names
UPDATE users 
SET username = CASE 
    WHEN email LIKE '%@%' THEN 
        'User_' || split_part(email, '@', 1) || '_' || floor(random() * 1000)::text
    ELSE 'User_' || floor(random() * 1000)::text
END
WHERE username IS NULL;

-- 4. Make username NOT NULL after populating
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

-- 5. Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 6. Verify the changes
SELECT 
    id,
    email,
    username,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check for any duplicate usernames (should be 0)
SELECT username, COUNT(*) as count
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 8. Note: After running this script, existing users will need to:
--    - Sign out and sign back in to get their proper Google names
--    - Or manually update their usernames in the database
