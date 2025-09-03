const express = require('express');
const router = express.Router();
const supabase = require('../db/index');
const { authenticateToken, requireAdmin} = require('../middleware/auth');
const { validateJobPosting } = require('../middleware/validation');
const { rateLimitMiddleware, generalRateLimiter } = require('../middleware/rateLimit');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { processPayment } = require('../services/paymentService');

// Get all jobs (with filters)
router.get('/', rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('jobs')
            .select('*, client:users(*)', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        if (status) {
            query = query.eq('status', status);
        }
        
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        
        query = query.range(offset, offset + limit - 1);
        
        const { data: jobs, error, count } = await query;
        
        if (error) {
            return res.status(400).json({ error: 'Failed to fetch jobs' });
        }
        
        res.json({
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Jobs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get job by ID
router.get('/:id', rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: job, error } = await supabase
            .from('jobs')
            .select('*, client:users(*), applications:job_applications(*, freelancer:users(*))')
            .eq('id', id)
            .single();
            
        if (error) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json(job);
    } catch (error) {
        console.error('Job fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new job
router.post('/', authenticateToken, validateJobPosting, async (req, res) => {
    try {
        const { title, description, location, timeline } = req.body;
        
        // Check if user already has an active job
        const { data: activeJobs, error: activeJobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('client_id', req.user.id)
            .in('status', ['posted', 'in_progress']);
            
        if (activeJobsError) {
            return res.status(400).json({ error: 'Failed to check active jobs' });
        }
        
        if (activeJobs && activeJobs.length > 0) {
            return res.status(400).json({ error: 'You can only have one active job at a time' });
        }
        
        // Create new job
        const { data: job, error } = await supabase
            .from('jobs')
            .insert([
                {
                    client_id: req.user.id,
                    title,
                    description,
                    location,
                    timeline,
                    status: 'posted'
                }
            ])
            .select('*, client:users(*)')
            .single();
            
        if (error) {
            return res.status(400).json({ error: 'Job creation failed' });
        }
        
        // Send notification email to client
        await sendEmail(
            req.user.email,
            emailTemplates.jobPosted(req.user.email, title).subject,
            emailTemplates.jobPosted(req.user.email, title).text,
            emailTemplates.jobPosted(req.user.email, title).html
        );
        
        res.status(201).json({ message: 'Job created successfully', job });
    } catch (error) {
        console.error('Job creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Apply to a job (freelancers only)
router.post('/:id/apply', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { proposed_rate } = req.body;
        
        // Check if user is a freelancer
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can apply to jobs' });
        }
        
        // Check if freelancer has an approved profile
        const { data: profile, error: profileError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('approval_status', 'approved')
            .single();
            
        if (profileError || !profile) {
            return res.status(403).json({ error: 'You need an approved freelancer profile to apply to jobs' });
        }
        
        // Check if job exists and is open
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*, client:users(*)')
            .eq('id', id)
            .eq('status', 'posted')
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found or not open for applications' });
        }
        
        // Check if freelancer has already applied
        const { data: existingApplication, error: applicationError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('job_id', id)
            .eq('freelancer_id', req.user.id)
            .single();
            
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this job' });
        }
        
        // Create application
        const { data: application, error } = await supabase
            .from('job_applications')
            .insert([
                {
                    job_id: id,
                    freelancer_id: req.user.id,
                    proposed_rate,
                    status: 'pending'
                }
            ])
            .select('*, freelancer:users(*)')
            .single();
            
        if (error) {
            return res.status(400).json({ error: 'Application failed' });
        }
        
        // Notify client
        await sendEmail(
            job.client.email,
            emailTemplates.freelancerApplied(
                job.client.email,
                req.user.email,
                job.title
            ).subject,
            emailTemplates.freelancerApplied(
                job.client.email,
                req.user.email,
                job.title
            ).text,
            emailTemplates.freelancerApplied(
                job.client.email,
                req.user.email,
                job.title
            ).html
        );
        
        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
        console.error('Job application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Select a freelancer for a job
router.post('/:id/select-freelancer/:freelancerId', authenticateToken, async (req, res) => {
    try {
        const { id, freelancerId } = req.params;
        
        // Check if job exists and belongs to the user
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*, client:users(*)')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        // Check if freelancer has applied to the job
        const { data: application, error: applicationError } = await supabase
            .from('job_applications')
            .select('*, freelancer:users(*)')
            .eq('job_id', id)
            .eq('freelancer_id', freelancerId)
            .single();
            
        if (applicationError || !application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        // Update job status and selected freelancer
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
                status: 'in_progress'
            })
            .eq('id', id)
            .select()
            .single();
            
        if (updateError) {
            return res.status(400).json({ error: 'Failed to update job' });
        }
        
        // Update application status
        await supabase
            .from('job_applications')
            .update({ status: 'accepted' })
            .eq('job_id', id)
            .eq('freelancer_id', freelancerId);
            
        // Reject all other applications
        await supabase
            .from('job_applications')
            .update({ status: 'rejected' })
            .eq('job_id', id)
            .neq('freelancer_id', freelancerId);
            
        // Create transaction record
        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    job_id: id,
                    client_id: req.user.id,
                    freelancer_id: freelancerId,
                    amount: application.proposed_rate,
                    payment_status: 'pending'
                }
            ])
            .select()
            .single();
            
        if (transactionError) {
            console.error('Transaction creation error:', transactionError);
        }
        
        res.json({ message: 'Freelancer selected successfully', job: updatedJob });
    } catch (error) {
        console.error('Freelancer selection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process payment for a job
router.post('/:id/payment', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod } = req.body;
        
        // Check if job exists and belongs to the user
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*, client:users(*), applications:job_applications(*, freelancer:users(*))')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        // Check if job is in progress
        if (job.status !== 'in_progress') {
            return res.status(400).json({ error: 'Job is not in progress' });
        }
        
        // Get the accepted application
        const acceptedApplication = job.applications.find(app => app.status === 'accepted');
        if (!acceptedApplication) {
            return res.status(400).json({ error: 'No accepted application found for this job' });
        }
        
        // Process payment
        const paymentResult = await processPayment({
            amount: acceptedApplication.proposed_rate,
            clientId: req.user.id,
            freelancerId: acceptedApplication.freelancer_id,
            jobId: id,
            paymentMethod
        });
        
        if (!paymentResult.success) {
            return res.status(400).json({ error: paymentResult.error });
        }
        
        // Update transaction record
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                payment_status: 'completed',
                payment_date: new Date(),
                payment_reference: paymentResult.paymentReference
            })
            .eq('job_id', id);
            
        if (updateError) {
            console.error('Transaction update error:', updateError);
        }
        
        res.json({ message: 'Payment processed successfully', paymentReference: paymentResult.paymentReference });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete a job
router.post('/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if job exists and belongs to the user
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*, client:users(*)')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        // Update job status to completed
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
                status: 'completed',
                completion_date: new Date(),
                archive_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            })
            .eq('id', id)
            .select()
            .single();
            
        if (updateError) {
            return res.status(400).json({ error: 'Failed to complete job' });
        }
        
        res.json({ message: 'Job completed successfully', job: updatedJob });
    } catch (error) {
        console.error('Job completion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Get all jobs with full details
router.get('/admin/jobs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('jobs')
            .select('*, client:users(*), applications:job_applications(*, freelancer:users(*))', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        if (status) {
            query = query.eq('status', status);
        }
        
        query = query.range(offset, offset + limit - 1);
        
        const { data: jobs, error, count } = await query;
        
        if (error) {
            return res.status(400).json({ error: 'Failed to fetch jobs' });
        }
        
        res.json({
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Admin jobs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Update job status
router.put('/admin/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const { data: job, error } = await supabase
            .from('jobs')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            return res.status(400).json({ error: 'Job update failed' });
        }
        
        res.json({ message: 'Job updated successfully', job });
    } catch (error) {
        console.error('Job update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Delete job
router.delete('/admin/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);
            
        if (error) {
            return res.status(400).json({ error: 'Job deletion failed' });
        }
        
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Job deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
