const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { rateLimitMiddleware, generalRateLimiter } = require('../middleware/rateLimit');
const notificationService = require('../services/notificationService');

// Get user notifications
router.get('/', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { page = 1, limit = 20, unread_only = false } = req.query;
        const offset = (page - 1) * limit;
        
        let notifications;
        
        if (unread_only === 'true') {
            // Get only unread notifications
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', req.user.id)
                .eq('read_status', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
                
            if (error) {
                console.error('Error fetching unread notifications:', error);
                return res.status(400).json({ error: 'Failed to fetch notifications' });
            }
            
            notifications = data || [];
        } else {
            // Get all notifications
            notifications = await notificationService.getUserNotifications(req.user.id, limit, offset);
        }
        
        res.json({
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: notifications.length
            }
        });
    } catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (error) {
        console.error('Unread count fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark notifications as read
router.put('/mark-read', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { notification_ids } = req.body;
        
        const success = await notificationService.markAsRead(req.user.id, notification_ids);
        
        if (success) {
            res.json({ message: 'Notifications marked as read' });
        } else {
            res.status(400).json({ error: 'Failed to mark notifications as read' });
        }
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const success = await notificationService.markAsRead(req.user.id);
        
        if (success) {
            res.json({ message: 'All notifications marked as read' });
        } else {
            res.status(400).json({ error: 'Failed to mark all notifications as read' });
        }
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { id } = req.params;
        
        const success = await notificationService.deleteNotification(req.user.id, id);
        
        if (success) {
            res.json({ message: 'Notification deleted' });
        } else {
            res.status(400).json({ error: 'Failed to delete notification' });
        }
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear all notifications
router.delete('/', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const supabase = require('../db/index');
        
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', req.user.id);
            
        if (error) {
            console.error('Error clearing notifications:', error);
            return res.status(400).json({ error: 'Failed to clear notifications' });
        }
        
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test notification endpoint (for development)
router.post('/test', authenticateToken, rateLimitMiddleware(generalRateLimiter), async (req, res) => {
    try {
        const { type = 'job_posted', title, message, data } = req.body;
        
        const notification = await notificationService.createNotification(
            req.user.id,
            type,
            title || 'Test Notification',
            message || 'This is a test notification',
            data
        );
        
        if (notification) {
            res.json({ message: 'Test notification created', notification });
        } else {
            res.status(400).json({ error: 'Failed to create test notification' });
        }
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
