-- Setup Ratings System for Juba Platform
-- Run this in your Supabase SQL Editor

-- 1. Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp);

-- 3. Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy 1: Users can view reviews for jobs they're involved in
CREATE POLICY "Users can view job reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs j 
            WHERE j.id = reviews.job_id 
            AND (j.client_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM job_applications ja 
                     WHERE ja.job_id = j.id 
                     AND ja.freelancer_id = auth.uid() 
                     AND ja.status = 'accepted'
                 ))
        )
    );

-- Policy 2: Users can view reviews they've given or received
CREATE POLICY "Users can view their own reviews" ON reviews
    FOR SELECT USING (
        reviewer_id = auth.uid() OR reviewed_id = auth.uid()
    );

-- Policy 3: Users can create reviews for completed jobs they're involved in
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs j 
            WHERE j.id = reviews.job_id 
            AND j.status = 'completed'
            AND (j.client_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM job_applications ja 
                     WHERE ja.job_id = j.id 
                     AND ja.freelancer_id = auth.uid() 
                     AND ja.status = 'accepted'
                 ))
        )
        AND reviewer_id = auth.uid()
        AND reviewer_id != reviewed_id
    );

-- Policy 4: Users can update their own reviews
CREATE POLICY "Users can update their reviews" ON reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- Policy 5: Users can delete their own reviews
CREATE POLICY "Users can delete their reviews" ON reviews
    FOR DELETE USING (reviewer_id = auth.uid());

-- 5. Check if table was created successfully
SELECT 
    'reviews' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 0 THEN 'EMPTY' ELSE 'HAS DATA' END as status
FROM reviews;

-- 6. Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

-- 7. Show RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'reviews';

-- 8. Show policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reviews';
