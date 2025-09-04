-- SQL Script to Create Admin Account
-- Run this in your Supabase SQL Editor

-- Option 1: Update existing user to admin
-- Replace 'user@example.com' with the actual email of the user you want to make admin
UPDATE users 
SET admin_status = true 
WHERE email = '2722188@students.wits.ac.za';

-- Option 2: Create a new admin user directly
-- Replace the values with your desired admin credentials
INSERT INTO users (
    id,
    google_id,
    email,
    phone,
    address,
    role,
    admin_status,
    profile_completion_status,
    verification_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin_' || extract(epoch from now())::text,
    'admin@jubaplatform.com',
    '+27123456789',
    'Johannesburg, South Africa',
    'client',
    true,
    true,
    true,
    now(),
    now()
);

-- Option 3: Check current admin users
SELECT id, email, admin_status, role, created_at 
FROM users 
WHERE admin_status = true;

-- Option 4: Check all users
SELECT id, email, admin_status, role, created_at 
FROM users 
ORDER BY created_at DESC;
