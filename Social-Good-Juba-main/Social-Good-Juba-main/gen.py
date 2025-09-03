import os
import json

def create_file(path, content):
    # Get the directory part of the path
    directory = os.path.dirname(path)
    # Only create directories if there is a directory path
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

def generate_juba_codebase():
    # Create package.json
    package_json = {
        "name": "juba-platform",
        "version": "1.0.0",
        "description": "Uber for odd jobs platform",
        "main": "server/index.js",
        "scripts": {
            "dev": "concurrently \"npm run server\" \"npm run client\"",
            "server": "nodemon server/index.js",
            "client": "cd client && npm start",
            "build": "cd client && npm run build",
            "install-all": "npm install && cd client && npm install"
        },
        "dependencies": {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "helmet": "^7.0.0",
            "dotenv": "^16.3.1",
            "jsonwebtoken": "^9.0.2",
            "google-auth-library": "^8.8.0",
            "@supabase/supabase-js": "^2.33.1",
            "socket.io": "^4.7.2",
            "rate-limiter-flexible": "^3.0.8",
            "express-validator": "^7.0.1",
            "nodemailer": "^6.9.7"
        },
        "devDependencies": {
            "nodemon": "^3.0.1",
            "concurrently": "^8.2.0"
        }
    }
    
    create_file("package.json", json.dumps(package_json, indent=2))
    
    # Create environment file
    env_content = """# Environment Configuration
NODE_ENV=development
PORT=5000

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Payment Gateway (South Africa)
PAYMENT_API_KEY=your_payment_api_key_here
PAYMENT_API_SECRET=your_payment_api_secret_here

# Email Configuration
EMAIL_USER=your_company_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Admin Configuration
ADMIN_EMAIL_DOMAIN=@jubaadmin.com

# JWT Secret
JWT_SECRET=your_jwt_secret_here_change_in_production
"""
    create_file(".env", env_content)
    
    # Create server directory and files
    # Database initialization
    db_init = """const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
"""
    create_file("server/db/index.js", db_init)
    
    # Database migrations
    migrations = """-- Database Schema for Juba Platform

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'freelancer', 'admin')),
    admin_status BOOLEAN DEFAULT FALSE,
    profile_completion_status BOOLEAN DEFAULT FALSE,
    verification_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freelancer Profiles Table
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INTEGER,
    service_areas TEXT[],
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    certifications TEXT[],
    documents JSONB,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    coverage_areas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'posted' CHECK (status IN ('posted', 'in_progress', 'completed', 'cancelled')),
    timeline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    archive_date TIMESTAMP WITH TIME ZONE
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proposed_rate DECIMAL(10, 2) NOT NULL,
    application_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'disputed')),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_status BOOLEAN DEFAULT FALSE
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_approval BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed'))
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_freelancer_id ON job_applications(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
"""
    create_file("server/db/migrations/01_initial_schema.sql", migrations)
    
    # Authentication middleware
    auth_middleware = """const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return { payload: ticket.getPayload(), success: true };
    } catch (error) {
        return { error: 'Invalid token', success: false };
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            admin_status: user.admin_status
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
    if (!req.user.admin_status) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = {
    verifyGoogleToken,
    generateToken,
    authenticateToken,
    requireAdmin
};
"""
    create_file("server/middleware/auth.js", auth_middleware)
    
    # Validation middleware
    validation_middleware = """const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('phone')
        .isMobilePhone()
        .withMessage('Valid phone number is required'),
    body('address')
        .isLength({ min: 5 })
        .withMessage('Address must be at least 5 characters long'),
    handleValidationErrors
];

// Job posting validation
const validateJobPosting = [
    body('title')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('location')
        .isLength({ min: 5 })
        .withMessage('Valid location is required'),
    handleValidationErrors
];

// Freelancer profile validation
const validateFreelancerProfile = [
    body('bio')
        .isLength({ min: 20, max: 1000 })
        .withMessage('Bio must be between 20 and 1000 characters'),
    body('experience_years')
        .isInt({ min: 0 })
        .withMessage('Experience years must be a positive number'),
    body('hourly_rate_min')
        .isFloat({ min: 0 })
        .withMessage('Minimum hourly rate must be a positive number'),
    body('hourly_rate_max')
        .isFloat({ min: 0 })
        .withMessage('Maximum hourly rate must be a positive number'),
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateJobPosting,
    validateFreelancerProfile,
    handleValidationErrors
};
"""
    create_file("server/middleware/validation.js", validation_middleware)
    
    # Rate limiting middleware
    rate_limit = """const { RateLimiterMemory } = require('rate-limiter-flexible');

// General rate limiter
const generalRateLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
});

// Auth rate limiter (stricter for auth endpoints)
const authRateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 300, // per 5 minutes
});

// Apply rate limiting middleware
const rateLimitMiddleware = (limiter) => {
    return (req, res, next) => {
        limiter.consume(req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                res.status(429).json({ error: 'Too many requests' });
            });
    };
};

module.exports = {
    generalRateLimiter,
    authRateLimiter,
    rateLimitMiddleware
};
"""
    create_file("server/middleware/rateLimit.js", rate_limit)
    
    # Email service
    email_service = """const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: html || text,
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    welcome: (name) => ({
        subject: 'Welcome to Juba!',
        text: `Hi ${name}, welcome to Juba! We're excited to have you on board.`,
        html: `<h1>Welcome to Juba!</h1><p>Hi ${name}, we're excited to have you on board.</p>`
    }),
    jobPosted: (name, jobTitle) => ({
        subject: 'Your job has been posted',
        text: `Hi ${name}, your job "${jobTitle}" has been successfully posted.`,
        html: `<h1>Job Posted</h1><p>Hi ${name}, your job "${jobTitle}" has been successfully posted.</p>`
    }),
    freelancerApplied: (clientName, freelancerName, jobTitle) => ({
        subject: 'New application for your job',
        text: `Hi ${clientName}, ${freelancerName} has applied for your job "${jobTitle}".`,
        html: `<h1>New Application</h1><p>Hi ${clientName}, ${freelancerName} has applied for your job "${jobTitle}".</p>`
    }),
    adminNotification: (title, message) => ({
        subject: `Admin Notification: ${title}`,
        text: message,
        html: `<h1>${title}</h1><p>${message}</p>`
    })
};

module.exports = {
    sendEmail,
    emailTemplates
};
"""
    create_file("server/services/emailService.js", email_service)
    
    # Payment service (placeholder for South African payment integration)
    payment_service = """// Placeholder for South African payment gateway integration
// This would be implemented with a specific payment provider's API

const processPayment = async (paymentData) => {
    try {
        // In a real implementation, this would call the payment gateway API
        const { amount, clientId, freelancerId, jobId } = paymentData;
        
        // Simulate payment processing
        console.log(`Processing payment of R${amount} for job ${jobId}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a mock payment reference
        const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            success: true,
            paymentReference,
            message: 'Payment processed successfully'
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            success: false,
            error: 'Payment processing failed'
        };
    }
};

const refundPayment = async (paymentReference) => {
    try {
        // Simulate refund processing
        console.log(`Processing refund for payment ${paymentReference}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            message: 'Refund processed successfully'
        };
    } catch (error) {
        console.error('Refund processing error:', error);
        return {
            success: false,
            error: 'Refund processing failed'
        };
    }
};

module.exports = {
    processPayment,
    refundPayment
};
"""
    create_file("server/services/paymentService.js", payment_service)
    
    # User routes
    user_routes = """const express = require('express');
const router = express.Router();
const supabase = require('../db/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserRegistration, handleValidationErrors } = require('../middleware/validation');
const { rateLimitMiddleware, authRateLimiter } = require('../middleware/rateLimit');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Google Sign-In authentication
router.post('/auth/google', rateLimitMiddleware(authRateLimiter), async (req, res) => {
    try {
        const { token, phone, address } = req.body;
        
        // Verify Google token
        const verification = await verifyGoogleToken(token);
        if (!verification.success) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }
        
        const { email, name, sub: googleId } = verification.payload;
        
        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();
            
        let user;
        
        if (userError || !existingUser) {
            // Create new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        google_id: googleId,
                        email,
                        phone,
                        address,
                        role: 'client',
                        // Check if admin based on email domain
                        admin_status: email.endsWith(process.env.ADMIN_EMAIL_DOMAIN)
                    }
                ])
                .select()
                .single();
                
            if (insertError) {
                return res.status(400).json({ error: 'User creation failed' });
            }
            
            user = newUser;
            
            // Send welcome email
            await sendEmail(email, 
                emailTemplates.welcome(name).subject,
                emailTemplates.welcome(name).text,
                emailTemplates.welcome(name).html
            );
        } else {
            user = existingUser;
            
            // Update user information if provided
            if (phone || address) {
                const updates = {};
                if (phone) updates.phone = phone;
                if (address) updates.address = address;
                
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update(updates)
                    .eq('id', user.id)
                    .select()
                    .single();
                    
                if (!updateError) {
                    user = updatedUser;
                }
            }
        }
        
        // Generate JWT token
        const jwtToken = generateToken(user);
        
        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                admin_status: user.admin_status,
                profile_completion_status: user.profile_completion_status
            }
        });
        
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
            
        if (error) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove sensitive information
        const { google_id, ...userData } = user;
        
        res.json(userData);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, validateUserRegistration, async (req, res) => {
    try {
        const { phone, address } = req.body;
        
        const { data: user, error } = await supabase
            .from('users')
            .update({ phone, address, profile_completion_status: true })
            .eq('id', req.user.id)
            .select()
            .single();
            
        if (error) {
            return res.status(400).json({ error: 'Profile update failed' });
        }
        
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Apply to become a freelancer
router.post('/become-freelancer', authenticateToken, async (req, res) => {
    try {
        const {
            bio,
            experience_years,
            service_areas,
            hourly_rate_min,
            hourly_rate_max,
            certifications,
            coverage_areas
        } = req.body;
        
        // Check if user already has a freelancer profile
        const { data: existingProfile, error: profileError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
            
        if (existingProfile) {
            return res.status(400).json({ error: 'Freelancer profile already exists' });
        }
        
        // Create freelancer profile
        const { data: profile, error: insertError } = await supabase
            .from('freelancer_profiles')
            .insert([
                {
                    user_id: req.user.id,
                    bio,
                    experience_years,
                    service_areas,
                    hourly_rate_min,
                    hourly_rate_max,
                    certifications,
                    coverage_areas,
                    approval_status: 'pending'
                }
            ])
            .select()
            .single();
            
        if (insertError) {
            return res.status(400).json({ error: 'Freelancer application failed' });
        }
        
        // Notify admins
        const { data: admins } = await supabase
            .from('users')
            .select('email')
            .eq('admin_status', true);
            
        if (admins && admins.length > 0) {
            const adminEmails = admins.map(admin => admin.email);
            const subject = 'New Freelancer Application';
            const message = `User ${req.user.email} has applied to become a freelancer.`;
            
            for (const email of adminEmails) {
                await sendEmail(
                    email,
                    emailTemplates.adminNotification(subject, message).subject,
                    emailTemplates.adminNotification(subject, message).text,
                    emailTemplates.adminNotification(subject, message).html
                );
            }
        }
        
        res.json({ message: 'Freelancer application submitted successfully', profile });
    } catch (error) {
        console.error('Freelancer application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Get all users
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            return res.status(400).json({ error: 'Failed to fetch users' });
        }
        
        res.json(users);
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Update user
router.put('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            return res.status(400).json({ error: 'User update failed' });
        }
        
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Delete user
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
            
        if (error) {
            return res.status(400).json({ error: 'User deletion failed' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
"""
    create_file("server/routes/users.js", user_routes)
    
    # Jobs routes
    jobs_routes = """const express = require('express');
const router = express.Router();
const supabase = require('../db/index');
const { authenticateToken } = require('../middleware/auth');
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
"""
    create_file("server/routes/jobs.js", jobs_routes)
    
    # Main server file
    server_index = """const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { rateLimitMiddleware, generalRateLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware(generalRateLimiter));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Juba server is running' });
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join room for a specific job
    socket.on('join-job', (jobId) => {
        socket.join(jobId);
        console.log(`User ${socket.id} joined job room ${jobId}`);
    });
    
    // Handle chat messages
    socket.on('send-message', async (data) => {
        try {
            const { jobId, senderId, receiverId, content } = data;
            
            // Save message to database
            const supabase = require('./db/index');
            const { data: message, error } = await supabase
                .from('messages')
                .insert([
                    {
                        job_id: jobId,
                        sender_id: senderId,
                        receiver_id: receiverId,
                        content
                    }
                ])
                .select()
                .single();
                
            if (error) {
                console.error('Message save error:', error);
                return;
            }
            
            // Emit message to the job room
            io.to(jobId).emit('receive-message', message);
        } catch (error) {
            console.error('Message handling error:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
"""
    create_file("server/index.js", server_index)
    
    # Create React app structure
    # Package.json for React app
    react_package_json = {
        "name": "juba-client",
        "version": "1.0.0",
        "description": "Juba platform client",
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
            "react-router-dom": "^6.15.0",
            "axios": "^1.5.0",
            "socket.io-client": "^4.7.2",
            "@react-oauth/google": "^0.11.1"
        },
        "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
        },
        "browserslist": {
            "production": [
                ">0.2%",
                "not dead",
                "not op_mini all"
            ],
            "development": [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
            ]
        }
    }
    
    create_file("client/package.json", json.dumps(react_package_json, indent=2))
    
    # Basic React app structure
    react_app = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
    create_file("client/src/index.js", react_app)
    
    # Main App component
    app_component = """import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import components
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobPost from './pages/JobPost';
import JobDetails from './pages/JobDetails';
import FreelancerApplication from './pages/FreelancerApplication';
import AdminDashboard from './pages/AdminDashboard';

// Import context
import { AuthProvider } from './context/AuthContext';

// Import styles
import './App.css';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post-job" element={<JobPost />} />
                <Route path="/job/:id" element={<JobDetails />} />
                <Route path="/become-freelancer" element={<FreelancerApplication />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
"""
    create_file("client/src/App.js", app_component)
    
    # CSS file
    app_css = """/* Global Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Header Styles */
.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover {
  background-color: #229954;
}

/* Form Styles */
.form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 2rem auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-error {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* Card Styles */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

/* Job List Styles */
.job-list {
  display: grid;
  gap: 1.5rem;
}

.job-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s;
}

.job-item:hover {
  transform: translateY(-2px);
}

.job-title {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.job-description {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.job-meta {
  display: flex;
  gap: 1rem;
  color: #95a5a6;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .form {
    padding: 1.5rem;
  }
  
  .job-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Loading Spinner */
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Chat Styles */
.chat-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 400px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.chat-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 80%;
}

.chat-message.own {
  background-color: #3498db;
  color: white;
  margin-left: auto;
}

.chat-message.other {
  background-color: #ecf0f1;
  color: #333;
}

.chat-input {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 0.5rem;
}

/* Admin Dashboard Styles */
.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Table Styles */
.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #2c3e50;
}

.table tr:hover {
  background-color: #f8f9fa;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-pending {
  background-color: #f39c12;
  color: white;
}

.status-approved {
  background-color: #27ae60;
  color: white;
}

.status-rejected {
  background-color: #e74c3c;
  color: white;
}

.status-completed {
  background-color: #3498db;
  color: white;
}
"""
    create_file("client/src/App.css", app_css)
    
    # Create basic component structure
    auth_context = """import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('juba_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile
      axios.get('/api/users/profile')
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(error => {
          console.error('Auth check failed:', error);
          localStorage.removeItem('juba_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('juba_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('juba_token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
"""
    create_file("client/src/context/AuthContext.js", auth_context)
    
    # Create basic component files
    create_file("client/src/components/Header.js", "// Header component placeholder")
    create_file("client/src/pages/Home.js", "// Home page placeholder")
    create_file("client/src/pages/Login.js", "// Login page placeholder")
    create_file("client/src/pages/Dashboard.js", "// Dashboard page placeholder")
    create_file("client/src/pages/JobPost.js", "// JobPost page placeholder")
    create_file("client/src/pages/JobDetails.js", "// JobDetails page placeholder")
    create_file("client/src/pages/FreelancerApplication.js", "// FreelancerApplication page placeholder")
    create_file("client/src/pages/AdminDashboard.js", "// AdminDashboard page placeholder")
    
    # Create public index.html
    index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Juba - Uber for odd jobs in South Africa"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Juba - Odd Jobs Platform</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
"""
    create_file("client/public/index.html", index_html)
    
    # Create README
    readme = """# Juba Platform

An "Uber for odd jobs" platform connecting clients with local freelancers for services like painting, plumbing, electrical work, etc.

## Tech Stack

- Backend: Node.js with Express.js
- Frontend: React
- Database: Supabase PostgreSQL
- Authentication: Google Sign-In
- Payment: South African-compatible payment API
- Deployment: Mobile web app

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Google OAuth credentials
- South African payment gateway account

### Installation

1. Clone the repository
2. Run `npm run install-all` to install both server and client dependencies
3. Set up your environment variables in `.env` file
4. Run database migrations in Supabase SQL editor
5. Start the development server with `npm run dev`

### Environment Variables

See `.env` file for all required environment variables.

## Features

- User authentication with Google Sign-In
- Job posting and application system
- Real-time chat between clients and freelancers
- Payment processing with escrow system
- Admin dashboard for platform management
- Mobile-optimized responsive design

## API Documentation

The API endpoints are organized as follows:

- `/api/users` - User authentication and management
- `/api/jobs` - Job posting and management
- WebSocket connections for real-time chat

## Deployment

The application is designed to be deployed as a mobile web app. The React frontend can be built with `npm run build` and served as static files.

## License

This project is proprietary software.
"""
    create_file("README.md", readme)
    
    print("Juba platform codebase generated successfully!")
    print("Next steps:")
    print("1. Run 'npm install' to install server dependencies")
    print("2. Run 'cd client && npm install' to install client dependencies")
    print("3. Set up your environment variables in the .env file")
    print("4. Run the database migrations in Supabase")
    print("5. Start the development server with 'npm run dev'")

if __name__ == "__main__":
    generate_juba_codebase()