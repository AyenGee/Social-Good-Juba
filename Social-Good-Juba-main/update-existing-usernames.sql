-- Update Existing Usernames to be more user-friendly
-- Run this in your Supabase SQL Editor

-- Update the first user (student number)
UPDATE users 
SET username = 'Admin'
WHERE email = '2722188@students.wits.ac.za';

-- Update the second user (name-based email)
UPDATE users 
SET username = 'Ayensu George'
WHERE email = 'ayensugeorge768@gmail.com';

-- Verify the changes
SELECT 
    id,
    email,
    username,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Note: These are temporary usernames. When users sign in again,
-- the system will automatically update them with their actual Google names.
