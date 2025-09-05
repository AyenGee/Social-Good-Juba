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
        
        // Force admin for specific email
        const forceAdmin = email === 'lancecorp06@gmail.com';

        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();
            
        let user;
        
        if (userError || !existingUser) {
            // Use Google account name as username
            let username = name;
            let counter = 1;
            
            // Check if username exists and make it unique
            while (true) {
                const { data: existingUsername, error: usernameError } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username)
                    .single();
                    
                if (usernameError && usernameError.code === 'PGRST116') {
                    // Username doesn't exist, we can use it
                    break;
                }
                
                if (existingUsername) {
                    // Username exists, try with counter
                    username = `${name} ${counter}`;
                    counter++;
                } else {
                    break;
                }
            }
            
            // Create new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        google_id: googleId,
                        email,
                        username,
                        phone,
                        address,
                        role: forceAdmin ? 'client' : 'client',
                        // Admin if matches hardcoded email or domain
                        admin_status: forceAdmin || (process.env.ADMIN_EMAIL_DOMAIN ? email.endsWith(process.env.ADMIN_EMAIL_DOMAIN) : false)
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
            
            // Update username if it's still email-based (old format)
            let needsUpdate = false;
            const updates = {};
            
            // Check if username is still in old format (email-based)
            if (user.username && (user.username.includes('@') || user.username === user.email.split('@')[0])) {
                // Generate new username from Google name
                let newUsername = name;
                let counter = 1;
                
                // Check if username exists and make it unique
                while (true) {
                    const { data: existingUsername, error: usernameError } = await supabase
                        .from('users')
                        .select('username')
                        .eq('username', newUsername)
                        .eq('id', '!=', user.id) // Exclude current user
                        .single();
                        
                    if (usernameError && usernameError.code === 'PGRST116') {
                        // Username doesn't exist, we can use it
                        break;
                    }
                    
                    if (existingUsername) {
                        // Username exists, try with counter
                        newUsername = `${name} ${counter}`;
                        counter++;
                    } else {
                        break;
                    }
                }
                
                updates.username = newUsername;
                needsUpdate = true;
            }
            
            // Update user information if provided, also admin status if forceAdmin
            if (phone || address) {
                if (phone) updates.phone = phone;
                if (address) updates.address = address;
                needsUpdate = true;
            }

            if (forceAdmin && !user.admin_status) {
                updates.admin_status = true;
                needsUpdate = true;
            }
            
            // Update user if needed
            if (needsUpdate) {
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
                username: user.username,
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

// Note: Profile routes have been moved to /api/profile for better organization

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
        
        // Normalize incoming types
        const normalizedProfile = {
            user_id: req.user.id,
            bio: bio || null,
            experience_years: Number.isFinite(experience_years) ? experience_years : (experience_years ? parseInt(experience_years) : null),
            service_areas: Array.isArray(service_areas) ? service_areas : (service_areas ? service_areas : []),
            hourly_rate_min: Number.isFinite(hourly_rate_min) ? hourly_rate_min : (hourly_rate_min ? parseFloat(hourly_rate_min) : null),
            hourly_rate_max: Number.isFinite(hourly_rate_max) ? hourly_rate_max : (hourly_rate_max ? parseFloat(hourly_rate_max) : null),
            certifications: Array.isArray(certifications) ? certifications : (certifications ? certifications : []),
            coverage_areas: Array.isArray(coverage_areas) ? coverage_areas : (coverage_areas ? coverage_areas : []),
            approval_status: 'approved',
            documents: {},
            updated_at: new Date().toISOString()
        };

        // Create or update freelancer profile without relying on ON CONFLICT
        const { data: existing, error: existingErr } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
            
        let profile;
        if (existing && !existingErr) {
            const { data: updated, error: updateErr } = await supabase
                .from('freelancer_profiles')
                .update({
                    bio: normalizedProfile.bio,
                    experience_years: normalizedProfile.experience_years,
                    service_areas: normalizedProfile.service_areas,
                    hourly_rate_min: normalizedProfile.hourly_rate_min,
                    hourly_rate_max: normalizedProfile.hourly_rate_max,
                    certifications: normalizedProfile.certifications,
                    coverage_areas: normalizedProfile.coverage_areas,
                    approval_status: normalizedProfile.approval_status,
                    documents: existing.documents || {},
                    updated_at: normalizedProfile.updated_at
                })
                .eq('user_id', req.user.id)
                .select()
                .single();
            if (updateErr) {
                console.error('Freelancer profile update error:', updateErr);
                return res.status(400).json({ error: 'Freelancer profile update failed: ' + updateErr.message });
            }
            profile = updated;
        } else {
            const { data: inserted, error: insertErr } = await supabase
                .from('freelancer_profiles')
                .insert([{ ...normalizedProfile }])
                .select()
                .single();
            if (insertErr) {
                console.error('Freelancer profile insert error:', insertErr);
                return res.status(400).json({ error: 'Freelancer profile creation failed: ' + insertErr.message });
            }
            profile = inserted;
        }

        // Ensure the user role is freelancer so Profile shows freelancer-specific UI
        const { data: updatedUser, error: userUpdateError } = await supabase
            .from('users')
            .update({ role: 'freelancer', updated_at: new Date().toISOString() })
            .eq('id', req.user.id)
            .select()
            .single();
            
        if (userUpdateError) {
            console.error('User role update error:', userUpdateError);
            // Not fatal for profile creation; continue
        }

        res.json({ 
            message: 'Freelancer profile ready', 
            profile, 
            user: updatedUser || null 
        });
    } catch (error) {
        console.error('Freelancer application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Get all users with their freelancer profiles
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id,
                email,
                username,
                role,
                admin_status,
                created_at,
                verification_status,
                freelancer_profiles!freelancer_profiles_user_id_fkey(
                    id,
                    approval_status,
                    documents,
                    created_at
                )
            `)
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

// Admin only: Verify or unverify a freelancer (police clearance approval)
router.post('/admin/freelancers/:userId/verify', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { verified } = req.body; // boolean

        // Update users.verification_status for top-level badge
        const { error: userErr } = await supabase
            .from('users')
            .update({ verification_status: !!verified })
            .eq('id', userId);

        if (userErr) {
            return res.status(400).json({ error: 'Failed to update user verification' });
        }

        // Also mark freelancer_profiles.approval_status
        const { error: profileErr } = await supabase
            .from('freelancer_profiles')
            .update({ approval_status: verified ? 'approved' : 'pending', updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (profileErr) {
            return res.status(400).json({ error: 'Failed to update freelancer profile status' });
        }

        res.json({ message: 'Verification status updated' });
    } catch (error) {
        console.error('Verify freelancer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all freelancer profiles (for admin viewing only)
router.get('/freelancer-profiles', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: profiles, error } = await supabase
            .from('freelancer_profiles')
            .select(`
                *,
                user:users!freelancer_profiles_user_id_fkey(id, email, created_at)
            `)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Freelancer profiles fetch error:', error);
            return res.status(400).json({ error: 'Failed to fetch freelancer profiles' });
        }
        
        res.json({ profiles: profiles || [] });
    } catch (error) {
        console.error('Freelancer profiles fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Debug endpoint to check database structure (remove in production)
router.get('/debug/freelancer-profiles', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Check table structure
        const { data: profiles, error } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('Debug query error:', error);
            return res.status(500).json({ error: 'Debug query failed: ' + error.message });
        }
        
        // Also check the users table to see if there are any users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, admin_status')
            .limit(5);
            
        // Check if there are any freelancer profiles with pending status
        const { data: pendingProfiles, error: pendingError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('approval_status', 'pending');
            
        res.json({
            message: 'Debug info',
            profileCount: profiles?.length || 0,
            pendingCount: pendingProfiles?.length || 0,
            userCount: users?.length || 0,
            sampleProfiles: profiles,
            sampleUsers: users,
            pendingProfiles: pendingProfiles,
            tableInfo: 'Check server logs for detailed structure'
        });
        
        // Log detailed structure
        console.log('Freelancer profiles debug info:', {
            count: profiles?.length || 0,
            pendingCount: pendingProfiles?.length || 0,
            userCount: users?.length || 0,
            sample: profiles,
            users: users,
            pending: pendingProfiles
        });
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: 'Debug endpoint failed: ' + error.message });
    }
});

// Get freelancer profile and applications for current user
router.get('/freelancer-profile', authenticateToken, async (req, res) => {
    try {
        console.log('=== FREELANCER PROFILE DEBUG ===');
        console.log('Fetching profile for user:', req.user.id);
        console.log('User email:', req.user.email);
        
        // Get freelancer profile
        const { data: profile, error: profileError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile error:', profileError);
            return res.status(400).json({ error: 'Failed to fetch freelancer profile' });
        }
        
        console.log('Profile found:', profile ? 'Yes' : 'No');
        
        // Get job applications
        const { data: applications, error: appsError } = await supabase
            .from('job_applications')
            .select(`
                *,
                job:jobs(title, client:users(email))
            `)
            .eq('freelancer_id', req.user.id)
            .order('created_at', { ascending: false });
            
        if (appsError) {
            console.error('Applications error:', appsError);
            return res.status(400).json({ error: 'Failed to fetch applications' });
        }
        
        console.log('Applications found:', applications?.length || 0);
        if (applications && applications.length > 0) {
            console.log('First application:', applications[0]);
        }
        
        // Transform applications data
        const transformedApplications = applications.map(app => ({
            id: app.id,
            job_title: app.job?.title || 'Unknown Job',
            client_email: app.job?.client?.email || 'Unknown Client',
            status: app.status,
            created_at: app.created_at,
            feedback: app.feedback
        }));
        
        const response = {
            hasApprovedProfile: true, // All users can access freelancer features
            profile: profile || null,
            applications: transformedApplications
        };
        
        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Freelancer profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin only: Create new admin user
router.post('/admin/create-admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, phone, address } = req.body;
        
        if (!email || !phone || !address) {
            return res.status(400).json({ error: 'Email, phone, and address are required' });
        }
        
        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
            
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Generate username from email for admin users
        const baseUsername = email.split('@')[0];
        let username = `Admin ${baseUsername}`;
        let counter = 1;
        
        // Check if username exists and make it unique
        while (true) {
            const { data: existingUsername, error: usernameError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();
                
            if (usernameError && usernameError.code === 'PGRST116') {
                // Username doesn't exist, we can use it
                break;
            }
            
            if (existingUsername) {
                // Username exists, try with counter
                username = `Admin ${baseUsername} ${counter}`;
                counter++;
            } else {
                break;
            }
        }
        
        // Create new admin user
        const { data: newAdmin, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    google_id: 'admin_' + Date.now(),
                    email,
                    username,
                    phone,
                    address,
                    role: 'client',
                    admin_status: true,
                    profile_completion_status: true,
                    verification_status: true
                }
            ])
            .select()
            .single();
            
        if (insertError) {
            console.error('Admin creation error:', insertError);
            return res.status(400).json({ error: 'Admin creation failed: ' + insertError.message });
        }
        
        // Send admin welcome email
        try {
            await sendEmail(
                email,
                'Welcome to Juba Platform - Admin Access Granted',
                `Welcome to Juba Platform! You have been granted administrative access. You can now access the admin dashboard and manage the platform.`,
                `<h2>Welcome to Juba Platform!</h2><p>You have been granted administrative access to the Juba Platform.</p><p>You can now:</p><ul><li>Access the admin dashboard</li><li>Review freelancer applications</li><li>Manage users and jobs</li><li>Monitor platform statistics</li></ul>`
            );
        } catch (emailError) {
            console.error('Admin welcome email failed:', emailError);
            // Continue even if email fails
        }
        
        res.json({ 
            message: 'Admin user created successfully', 
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                username: newAdmin.username,
                admin_status: newAdmin.admin_status,
                created_at: newAdmin.created_at
            }
        });
        
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;