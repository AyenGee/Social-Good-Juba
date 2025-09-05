const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { rateLimitMiddleware, generalRateLimiter } = require('../middleware/rateLimit');

// Create a new report
router.post('/', rateLimitMiddleware(generalRateLimiter), authenticateToken, async (req, res) => {
    try {
        const { reported_user_id, report_type, description, job_id, chat_id } = req.body;
        const reporter_id = req.user.id;

        if (!reported_user_id || !report_type || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                reporter_id,
                reported_user_id,
                report_type,
                description,
                job_id: job_id || null,
                chat_id: chat_id || null,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Report creation error:', error);
            return res.status(400).json({ error: 'Failed to create report' });
        }

        res.status(201).json({ report });
    } catch (error) {
        console.error('Report creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all reports
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:users!reports_reporter_id_fkey(
                    id,
                    username,
                    email
                ),
                reported_user:users!reports_reported_user_id_fkey(
                    id,
                    username,
                    email
                ),
                job:jobs(
                    id,
                    title
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Reports fetch error:', error);
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                return res.json({ reports: [] });
            }
            return res.status(400).json({ error: 'Failed to fetch reports' });
        }

        res.json({ reports: reports || [] });
    } catch (error) {
        console.error('Reports fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update report status
router.put('/admin/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data: report, error } = await supabase
            .from('reports')
            .update({
                status,
                admin_notes: admin_notes || null,
                resolved_at: status === 'resolved' ? new Date().toISOString() : null,
                resolved_by: req.user.id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Report update error:', error);
            return res.status(400).json({ error: 'Failed to update report' });
        }

        res.json({ report });
    } catch (error) {
        console.error('Report update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all chats
router.get('/admin/chats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                client:users!conversations_client_id_fkey(
                    id,
                    username,
                    email
                ),
                freelancer:users!conversations_freelancer_id_fkey(
                    id,
                    username,
                    email
                ),
                messages:messages(
                    id,
                    content,
                    sender_id,
                    created_at,
                    sender:users!messages_sender_id_fkey(
                        username
                    )
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Admin chats fetch error:', error);
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                return res.json({ conversations: [] });
            }
            return res.status(400).json({ error: 'Failed to fetch chats' });
        }

        res.json({ conversations: conversations || [] });
    } catch (error) {
        console.error('Admin chats fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Delete job
router.delete('/admin/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete related records first
        await supabase.from('job_applications').delete().eq('job_id', id);
        await supabase.from('reviews').delete().eq('job_id', id);

        // Delete the job
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Job deletion error:', error);
            return res.status(400).json({ error: 'Failed to delete job' });
        }

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Job deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update job
router.put('/admin/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const { data: job, error } = await supabase
            .from('jobs')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Job update error:', error);
            return res.status(400).json({ error: 'Failed to update job' });
        }

        res.json({ job });
    } catch (error) {
        console.error('Job update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
