const express = require('express');
const router = express.Router();
const supabase = require('../db/index');
const { authenticateToken, requireAdmin, verifyGoogleToken, generateToken } = require('../middleware/auth');
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
                console.error('User creation error:', insertError);
                return res.status(400).json({ error: 'User creation failed: ' + insertError.message });
            }
            
            user = newUser;
            
            // Send welcome email
            try {
                await sendEmail(email, 
                    emailTemplates.welcome(name).subject,
                    emailTemplates.welcome(name).text,
                    emailTemplates.welcome(name).html
                );
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue even if email fails
            }
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
        res.status(500).json({ error: 'Internal server error: ' + error.message });
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