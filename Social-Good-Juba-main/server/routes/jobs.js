const express = require('express');
const router = express.Router();
const supabase = require('../db/index');
const { authenticateToken, requireAdmin} = require('../middleware/auth');
const { validateJobPosting } = require('../middleware/validation');
const { rateLimitMiddleware, generalRateLimiter } = require('../middleware/rateLimit');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { processPayment } = require('../services/paymentService');
const notificationService = require('../services/notificationService');

// Debug endpoint to check database status
router.get('/debug/database', async (req, res) => {
    try {
        console.log('=== DATABASE DEBUG ENDPOINT ===');
        
        // Check if tables exist and have data
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, role, admin_status')
            .limit(5);
            
        const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .limit(5);
            
        const { data: profiles, error: profilesError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .limit(5);
            
        const debugInfo = {
            users: {
                count: users?.length || 0,
                data: users || [],
                error: usersError?.message || null
            },
            jobs: {
                count: jobs?.length || 0,
                data: jobs || [],
                error: jobsError?.message || null
            },
            freelancerProfiles: {
                count: profiles?.length || 0,
                data: profiles || [],
                error: profilesError?.message || null
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('Debug info:', debugInfo);
        res.json(debugInfo);
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: 'Debug endpoint error', details: error.message });
    }
});

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
            console.error('Jobs fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch jobs' });
        }
        
        res.json({
            jobs: jobs || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0
            }
        });
    } catch (error) {
        console.error('Jobs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get applications for specific jobs
router.get('/applications', authenticateToken, async (req, res) => {
    try {
        const { jobIds } = req.query;
        
        if (!jobIds) {
            return res.status(400).json({ error: 'jobIds parameter is required' });
        }
        
        // Parse jobIds from comma-separated string
        const jobIdArray = jobIds.split(',');
        
        // Get applications for the specified jobs
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    description,
                    status
                ),
                freelancer:users!job_applications_freelancer_id_fkey (
                    id,
                    username,
                    email
                )
            `)
            .in('job_id', jobIdArray)
            .order('application_timestamp', { ascending: false });
        
        if (error) {
            console.error('Error fetching applications:', error);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        
        res.json({ applications: applications || [] });
    } catch (error) {
        console.error('Error in applications endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get applications for current user
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get applications where user is the freelancer
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    description,
                    status,
                    client:users!jobs_client_id_fkey (
                        id,
                        username,
                        email
                    )
                )
            `)
            .eq('freelancer_id', userId)
            .order('application_timestamp', { ascending: false });
        
        if (error) {
            console.error('Error fetching my applications:', error);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        
        res.json({ applications: applications || [] });
    } catch (error) {
        console.error('Error in my-applications endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's own jobs (for client dashboard)
router.get('/my-jobs', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching jobs for user:', req.user.id);
        
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('client_id', req.user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('My jobs fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch jobs' });
        }
        
        console.log('Found jobs:', jobs?.length || 0);
        res.json({ jobs: jobs || [] });
    } catch (error) {
        console.error('My jobs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get client statistics
router.get('/client-stats', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching client stats for user:', req.user.id);
        
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('client_id', req.user.id);
            
        if (error) {
            console.error('Client stats error:', error);
            return res.status(400).json({ error: 'Failed to fetch client stats' });
        }
        
        const stats = {
            totalJobs: jobs?.length || 0,
            activeJobs: jobs?.filter(job => job.status === 'posted' || job.status === 'in_progress').length || 0,
            completedJobs: jobs?.filter(job => job.status === 'completed').length || 0,
            totalApplications: 0 // Will be calculated from job_applications table
        };
        
        // Calculate total applications across all jobs
        if (jobs && jobs.length > 0) {
            const jobIds = jobs.map(job => job.id);
            const { data: applications, error: appsError } = await supabase
                .from('job_applications')
                .select('*')
                .in('job_id', jobIds);
                
            if (!appsError) {
                stats.totalApplications = applications?.length || 0;
            }
        }
        
        console.log('Client stats:', stats);
        res.json({ stats });
    } catch (error) {
        console.error('Client stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available jobs for freelancers (all users can see now)
router.get('/available-jobs', authenticateToken, async (req, res) => {
    try {
        console.log('=== AVAILABLE JOBS DEBUG ===');
        console.log('Fetching available jobs for user:', req.user.id);
        console.log('User email:', req.user.email);
        
        // First, let's check if there are any jobs at all in the database
        const { data: allJobs, error: allJobsError } = await supabase
            .from('jobs')
            .select('*');
            
        if (allJobsError) {
            console.error('Error checking all jobs:', allJobsError);
        } else {
            console.log('Total jobs in database:', allJobs?.length || 0);
            if (allJobs && allJobs.length > 0) {
                console.log('Sample job:', allJobs[0]);
            }
        }
        
        // Get available jobs (posted status, not assigned)
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*, client:users(email)')
            .eq('status', 'posted')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Available jobs fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch available jobs' });
        }
        
        console.log('Available jobs found:', jobs?.length || 0);
        if (jobs && jobs.length > 0) {
            console.log('First available job:', jobs[0]);
        }
        
        // Also check if the issue is with the client relationship
        const { data: jobsWithClient, error: clientError } = await supabase
            .from('jobs')
            .select('*, client:users!jobs_client_id_fkey(email)')
            .eq('status', 'posted')
            .order('created_at', { ascending: false });
            
        if (clientError) {
            console.error('Jobs with client relationship error:', clientError);
        } else {
            console.log('Jobs with client relationship found:', jobsWithClient?.length || 0);
        }
        
        res.json({ jobs: jobs || [] });
    } catch (error) {
        console.error('Available jobs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get freelancer statistics
router.get('/freelancer-stats', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching freelancer stats for user:', req.user.id);
        
        // Get freelancer applications and completed jobs
        const { data: applications, error: appsError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('freelancer_id', req.user.id);
            
        if (appsError) {
            console.error('Freelancer stats error:', appsError);
            return res.status(400).json({ error: 'Failed to fetch freelancer stats' });
        }
        
        // Get freelancer rating from reviews table
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewed_id', req.user.id);
        
        let averageRating = 0;
        if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
        }
        
        // Calculate total earnings from accepted applications
        let totalEarnings = 0;
        if (applications && applications.length > 0) {
            // Get all accepted applications and sum their proposed rates
            const acceptedApplications = applications.filter(app => app.status === 'accepted');
            console.log('Accepted applications for earnings calculation:', acceptedApplications);
            totalEarnings = acceptedApplications.reduce((sum, app) => {
                const rate = parseFloat(app.proposed_rate) || 0;
                console.log(`Adding rate: ${rate} from application ${app.id}`);
                return sum + rate;
            }, 0);
            console.log('Total earnings calculated:', totalEarnings);
        }
        
        const stats = {
            applicationsSent: applications?.length || 0,
            jobsCompleted: applications?.filter(app => app.status === 'accepted').length || 0,
            rating: averageRating,
            totalEarnings: totalEarnings
        };
        
        console.log('Freelancer stats:', stats);
        console.log('Rating value being sent:', stats.rating);
        console.log('Rating type being sent:', typeof stats.rating);
        res.json({ stats });
    } catch (error) {
        console.error('Freelancer stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get applications for a specific job
router.get('/:id/applications', rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select(`
                *,
                freelancer:users(id, username, email)
            `)
            .eq('job_id', id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Applications fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch applications' });
        }
        
        res.json(applications || []);
    } catch (error) {
        console.error('Applications fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve an application
router.post('/:id/applications/:applicationId/approve', authenticateToken, async (req, res) => {
    try {
        const { id, applicationId } = req.params;
        
        // Check if job exists and belongs to the user
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found or you do not have permission' });
        }
        
        // Check if job is still open for applications
        if (job.status !== 'posted') {
            return res.status(400).json({ error: 'Job is no longer open for applications' });
        }
        
        // Check if application exists and is pending
        const { data: application, error: appError } = await supabase
            .from('job_applications')
            .select('*, freelancer:users(*)')
            .eq('id', applicationId)
            .eq('job_id', id)
            .eq('status', 'pending')
            .single();
            
        if (appError || !application) {
            return res.status(404).json({ error: 'Application not found or already processed' });
        }
        
        // Update the application status to accepted
        const { error: updateAppError } = await supabase
            .from('job_applications')
            .update({ status: 'accepted' })
            .eq('id', applicationId);
            
        if (updateAppError) {
            return res.status(400).json({ error: 'Failed to approve application' });
        }
        
        // Reject all other pending applications for this job
        await supabase
            .from('job_applications')
            .update({ status: 'rejected' })
            .eq('job_id', id)
            .eq('status', 'pending')
            .neq('id', applicationId);
        
        // Update job status to in_progress
        const { error: updateJobError } = await supabase
            .from('jobs')
            .update({ 
                status: 'in_progress'
            })
            .eq('id', id);
            
        if (updateJobError) {
            console.error('Failed to update job status:', updateJobError);
        }
        
        // Create transaction record
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    job_id: id,
                    client_id: req.user.id,
                    freelancer_id: application.freelancer_id,
                    amount: application.proposed_rate,
                    payment_status: 'pending'
                }
            ]);
            
        if (transactionError) {
            console.error('Transaction creation error:', transactionError);
        }
        
        // Notify freelancer about application approval
        try {
            await notificationService.notifyApplicationStatus(application, job, req.user, 'accepted');
        } catch (notificationError) {
            console.error('Notification sending failed:', notificationError);
        }
        
        res.json({ message: 'Application approved successfully', application });
    } catch (error) {
        console.error('Application approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject an application
router.post('/:id/applications/:applicationId/reject', authenticateToken, async (req, res) => {
    try {
        const { id, applicationId } = req.params;
        
        // Check if job exists and belongs to the user
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found or you do not have permission' });
        }
        
        // Check if application exists and is pending
        const { data: application, error: appError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('id', applicationId)
            .eq('job_id', id)
            .eq('status', 'pending')
            .single();
            
        if (appError || !application) {
            return res.status(404).json({ error: 'Application not found or already processed' });
        }
        
        // Update the application status to rejected
        const { error: updateError } = await supabase
            .from('job_applications')
            .update({ status: 'rejected' })
            .eq('id', applicationId);
            
        if (updateError) {
            return res.status(400).json({ error: 'Failed to reject application' });
        }
        
        // Notify freelancer about application rejection
        try {
            await notificationService.notifyApplicationStatus(application, job, req.user, 'rejected');
        } catch (notificationError) {
            console.error('Notification sending failed:', notificationError);
        }
        
        res.json({ message: 'Application rejected successfully' });
    } catch (error) {
        console.error('Application rejection error:', error);
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
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('=== JOB CREATION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('User ID:', req.user.id);
        console.log('User email:', req.user.email);
        
        const { title, description, location, timeline } = req.body;
        
        // Validate required fields
        if (!title || !description || !location) {
            console.log('Missing required fields:', { title: !!title, description: !!description, location: !!location });
            return res.status(400).json({ error: 'Missing required fields: title, description, and location are required' });
        }
        
        // Validate field lengths
        if (title.length < 5 || title.length > 100) {
            return res.status(400).json({ error: 'Title must be between 5 and 100 characters' });
        }
        
        if (description.length < 10 || description.length > 1000) {
            return res.status(400).json({ error: 'Description must be between 10 and 1000 characters' });
        }
        
        if (location.length < 5) {
            return res.status(400).json({ error: 'Location must be at least 5 characters' });
        }
        
        console.log('Validation passed, creating job...');
        
        // Create new job (removed the one-job limit)
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
        
        // Send notification email to client (wrapped in try-catch to prevent email failures from breaking job creation)
        try {
            await sendEmail(
                req.user.email,
                emailTemplates.jobPosted(req.user.email, title).subject,
                emailTemplates.jobPosted(req.user.email, title).text,
                emailTemplates.jobPosted(req.user.email, title).html
            );
        } catch (emailError) {
            console.error('Email sending failed, but job was created:', emailError);
            // Don't fail the job creation if email fails
        }
        
        // Notify freelancers about the new job
        try {
            await notificationService.notifyNewJob(job);
        } catch (notificationError) {
            console.error('Notification sending failed, but job was created:', notificationError);
            // Don't fail the job creation if notifications fail
        }
        
        console.log('Job created successfully:', job);
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
        
        // Check if user has a freelancer profile (any user can apply if they have a profile)
        const { data: profile, error: profileError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            return res.status(403).json({ error: 'You need a freelancer profile to apply to jobs' });
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
        
        // Create application (removed the one-application-per-job limit)
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
        
        // Notify client via email
        try {
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
        } catch (emailError) {
            console.error('Email sending failed, but application was created:', emailError);
        }
        
        // Notify client via in-app notification
        try {
            await notificationService.notifyJobApplication(application, job, req.user);
        } catch (notificationError) {
            console.error('Notification sending failed, but application was created:', notificationError);
        }
        
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
        
        // Get the accepted freelancer for notifications
        const { data: acceptedApplication } = await supabase
            .from('job_applications')
            .select('freelancer_id')
            .eq('job_id', id)
            .eq('status', 'accepted')
            .single();
        
        // Notify about job completion
        try {
            await notificationService.notifyJobCompletion(updatedJob, acceptedApplication?.freelancer_id);
        } catch (notificationError) {
            console.error('Notification sending failed:', notificationError);
        }
        
        res.json({ message: 'Job completed successfully', job: updatedJob });
    } catch (error) {
        console.error('Job completion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Client job management endpoints
// Update job (only by the job owner)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, budget, timeline } = req.body;
        
        // First check if the job exists and belongs to the authenticated user
        const { data: existingJob, error: fetchError } = await supabase
            .from('jobs')
            .select('client_id')
            .eq('id', id)
            .single();
            
        if (fetchError || !existingJob) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        if (existingJob.client_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own jobs' });
        }
        
        // Update the job
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
                title,
                description,
                location,
                budget: budget ? parseFloat(budget) : null,
                timeline
            })
            .eq('id', id)
            .select()
            .single();
            
        if (updateError) {
            console.error('Job update error:', updateError);
            return res.status(400).json({ error: 'Failed to update job' });
        }
        
        res.json({ message: 'Job updated successfully', job: updatedJob });
    } catch (error) {
        console.error('Job update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete job (only by the job owner)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('=== JOB DELETION DEBUG ===');
        console.log('Job ID:', id);
        console.log('User ID:', req.user.id);
        console.log('User email:', req.user.email);
        
        // First check if the job exists and belongs to the authenticated user
        const { data: existingJob, error: fetchError } = await supabase
            .from('jobs')
            .select('client_id, status, title')
            .eq('id', id)
            .single();
            
        console.log('Existing job:', existingJob);
        console.log('Fetch error:', fetchError);
            
        if (fetchError || !existingJob) {
            console.log('Job not found or fetch error');
            return res.status(404).json({ error: 'Job not found' });
        }
        
        if (existingJob.client_id !== req.user.id) {
            console.log('Job does not belong to user. Job client_id:', existingJob.client_id, 'User ID:', req.user.id);
            return res.status(403).json({ error: 'You can only delete your own jobs' });
        }
        
        // Check if job can be deleted (only prevent deletion of completed jobs)
        if (existingJob.status === 'completed') {
            console.log('Job cannot be deleted due to status:', existingJob.status);
            return res.status(400).json({ 
                error: 'Cannot delete completed jobs. Completed jobs are kept for record purposes.' 
            });
        }
        
        console.log('Job can be deleted, proceeding with deletion...');
        
        // Delete the job
        const { error: deleteError } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);
            
        if (deleteError) {
            console.error('Job deletion error:', deleteError);
            return res.status(400).json({ error: 'Failed to delete job' });
        }
        
        console.log('Job deleted successfully');
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Job deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get freelancer's own applications (for freelancer dashboard)
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        console.log('=== MY APPLICATIONS DEBUG ===');
        console.log('Fetching applications for user:', req.user.id);
        
        // Get all applications by this freelancer with explicit job relationship
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select(`
                *,
                jobs!job_applications_job_id_fkey(
                    id,
                    title,
                    description,
                    location,
                    status,
                    created_at,
                    completion_date,
                    client:users!jobs_client_id_fkey(id, username, email)
                )
            `)
            .eq('freelancer_id', req.user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('My applications fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch applications' });
        }
        
        console.log('Raw applications data:', applications);
        
        // Transform the data to match what the frontend expects
        const transformedApplications = applications.map(app => {
            console.log('Processing application:', app.id, 'with job:', app.jobs);
            
            const transformed = {
                id: app.id,
                job_id: app.job_id,
                job_title: app.jobs?.title || 'Unknown Job',
                job_status: app.jobs?.status || 'unknown',
                client_id: app.jobs?.client?.id || null,
                client_email: app.jobs?.client?.username || app.jobs?.client?.email || 'Unknown Client',
                proposed_rate: app.proposed_rate,
                status: app.status,
                created_at: app.created_at,
                job_completion_date: app.jobs?.completion_date || null,
                message: app.feedback || null
            };
            
            console.log('Transformed application:', transformed);
            return transformed;
        });
        
        console.log('Final transformed applications:', transformedApplications);
        
        // If any applications have 'unknown' status, try to fetch job statuses directly
        const unknownStatusApps = transformedApplications.filter(app => app.job_status === 'unknown');
        if (unknownStatusApps.length > 0) {
            console.log('Found applications with unknown status, fetching job statuses directly...');
            
            try {
                const jobIds = unknownStatusApps.map(app => app.job_id).filter(Boolean);
                if (jobIds.length > 0) {
                    const { data: jobStatuses, error: statusError } = await supabase
                        .from('jobs')
                        .select('id, status, title')
                        .in('id', jobIds);
                    
                    if (!statusError && jobStatuses) {
                        console.log('Direct job statuses fetched:', jobStatuses);
                        
                        // Update applications with correct statuses
                        transformedApplications.forEach(app => {
                            if (app.job_status === 'unknown') {
                                const jobStatus = jobStatuses.find(job => job.id === app.job_id);
                                if (jobStatus) {
                                    app.job_status = jobStatus.status;
                                    app.job_title = jobStatus.title || app.job_title;
                                    console.log(`Updated application ${app.id} with status: ${jobStatus.status}`);
                                }
                            }
                        });
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback job status fetch error:', fallbackError);
            }
        }
        
        res.json({ applications: transformedApplications });
    } catch (error) {
        console.error('My applications fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get applications for specific jobs (for client dashboard)
router.get('/applications', authenticateToken, async (req, res) => {
    try {
        const { jobIds } = req.query;
        
        if (!jobIds) {
            return res.status(400).json({ error: 'Job IDs are required' });
        }
        
        const jobIdArray = jobIds.split(',');
        
        // Get applications for the specified jobs
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select(`
                *,
                job:jobs(title, status),
                freelancer:users(id, username, email)
            `)
            .in('job_id', jobIdArray)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Applications fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch applications' });
        }
        
        // Transform the data to match what the frontend expects
        const transformedApplications = applications.map(app => ({
            id: app.id,
            job_id: app.job_id,
            job_title: app.job?.title || 'Unknown Job',
            freelancer_id: app.freelancer?.id || null,
            freelancer_email: app.freelancer?.username || app.freelancer?.email || 'Unknown Freelancer',
            proposed_rate: app.proposed_rate,
            status: app.status,
            created_at: app.created_at,
            message: app.feedback || null
        }));
        
        res.json({ applications: transformedApplications });
    } catch (error) {
        console.error('Applications fetch error:', error);
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

// Get batch job statuses for multiple job IDs
router.get('/batch-status', authenticateToken, async (req, res) => {
    try {
        const { jobIds } = req.query;
        
        if (!jobIds) {
            return res.status(400).json({ error: 'Job IDs parameter is required' });
        }
        
        const jobIdArray = jobIds.split(',').filter(Boolean);
        
        if (jobIdArray.length === 0) {
            return res.json({ jobs: [] });
        }
        
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id, title, status, created_at')
            .in('id', jobIdArray);
            
        if (error) {
            console.error('Batch status fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch job statuses' });
        }
        
        res.json({ jobs: jobs || [] });
    } catch (error) {
        console.error('Batch status fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update job status (for testing/debugging)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Verify job exists and user owns it
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('client_id', req.user.id)
            .single();
            
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found or access denied' });
        }
        
        // Update job status
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ 
                status: status
            })
            .eq('id', id);
            
        if (updateError) {
            console.error('Job status update error:', updateError);
            return res.status(400).json({ error: 'Failed to update job status' });
        }
        
        res.json({ message: 'Job status updated successfully', status: status });
    } catch (error) {
        console.error('Job status update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
