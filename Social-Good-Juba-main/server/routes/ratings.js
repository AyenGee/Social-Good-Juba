const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get user's average rating
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', userId);
    
    if (error) {
      console.error('Error fetching user ratings:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
    
    if (!reviews || reviews.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0, ratings: [] });
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Count ratings by star level
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingCounts[review.rating]++;
    });
    
    res.json({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
      ratings: ratingCounts
    });
  } catch (error) {
    console.error('Error in get user ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a rating for a user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { jobId, reviewedUserId, rating, comment } = req.body;
    const reviewerId = req.user.id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if job exists and is completed
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, client_id')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate users for completed jobs' });
    }
    
    // Check if reviewer is involved in the job (either client or freelancer)
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('freelancer_id')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single();
    
    if (appError || !application) {
      return res.status(400).json({ error: 'No accepted application found for this job' });
    }
    
    // Verify reviewer is either the client or the freelancer
    if (reviewerId !== job.client_id && reviewerId !== application.freelancer_id) {
      return res.status(403).json({ error: 'You can only rate users involved in this job' });
    }
    
    // Check if reviewer has already rated the reviewed user for this job
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', jobId)
      .eq('reviewer_id', reviewerId)
      .eq('reviewed_id', reviewedUserId)
      .single();
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already rated this user for this job' });
    }
    
    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        job_id: jobId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedUserId,
        rating: rating,
        comment: comment || null
      })
      .select()
      .single();
    
    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return res.status(500).json({ error: 'Failed to submit rating' });
    }
    
    res.status(201).json({ 
      message: 'Rating submitted successfully',
      review: review
    });
    
  } catch (error) {
    console.error('Error in submit rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviews for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        timestamp,
        reviewer:users!reviews_reviewer_id_fkey(username, email),
        reviewed:users!reviews_reviewed_id_fkey(username, email)
      `)
      .eq('job_id', jobId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching job reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
    
    res.json({ reviews: reviews || [] });
  } catch (error) {
    console.error('Error in get job reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's review history (reviews they've given and received)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get reviews given by user
    const { data: givenReviews, error: givenError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        timestamp,
        job:jobs!reviews_job_id_fkey(title, description),
        reviewed:users!reviews_reviewed_id_fkey(username, email)
      `)
      .eq('reviewer_id', userId)
      .order('timestamp', { ascending: false });
    
    // Get reviews received by user
    const { data: receivedReviews, error: receivedError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        timestamp,
        job:jobs!reviews_job_id_fkey(title, description),
        reviewer:users!reviews_reviewer_id_fkey(username, email)
      `)
      .eq('reviewed_id', userId)
      .order('timestamp', { ascending: false });
    
    if (givenError || receivedError) {
      console.error('Error fetching review history:', { givenError, receivedError });
      return res.status(500).json({ error: 'Failed to fetch review history' });
    }
    
    res.json({
      given: givenReviews || [],
      received: receivedReviews || []
    });
  } catch (error) {
    console.error('Error in get review history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a review (only by the original reviewer)
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if review exists and belongs to user
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single();
    
    if (existingError || !existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (existingReview.reviewer_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }
    
    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating: rating,
        comment: comment || null,
        timestamp: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating review:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }
    
    res.json({ 
      message: 'Review updated successfully',
      review: updatedReview
    });
    
  } catch (error) {
    console.error('Error in update review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a review (only by the original reviewer)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and belongs to user
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single();
    
    if (existingError || !existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (existingReview.reviewer_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    
    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return res.status(500).json({ error: 'Failed to delete review' });
    }
    
    res.json({ message: 'Review deleted successfully' });
    
  } catch (error) {
    console.error('Error in delete review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
