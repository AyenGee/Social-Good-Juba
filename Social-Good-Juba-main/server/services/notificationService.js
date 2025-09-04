const supabase = require('../db/index');

class NotificationService {
    constructor() {
        this.io = null; // Will be set by the server
    }

    // Set the Socket.IO instance
    setSocketIO(io) {
        this.io = io;
    }

    // Create a notification
    async createNotification(userId, type, title, message, data = null) {
        try {
            const { data: notification, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    type,
                    title,
                    message,
                    data: data || {}
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating notification:', error);
                return null;
            }

            // Send real-time notification via Socket.IO
            this.sendRealtimeNotification(userId, notification);

            return notification;
        } catch (error) {
            console.error('Error in createNotification:', error);
            return null;
        }
    }

    // Send real-time notification via Socket.IO
    sendRealtimeNotification(userId, notification) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit('notification', notification);
        }
    }

    // Get notifications for a user
    async getUserNotifications(userId, limit = 20, offset = 0) {
        try {
            const { data: notifications, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching notifications:', error);
                return [];
            }

            return notifications || [];
        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            return [];
        }
    }

    // Get unread notification count
    async getUnreadCount(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact' })
                .eq('user_id', userId)
                .eq('read_status', false);

            if (error) {
                console.error('Error fetching unread count:', error);
                return 0;
            }

            return data?.length || 0;
        } catch (error) {
            console.error('Error in getUnreadCount:', error);
            return 0;
        }
    }

    // Mark notifications as read
    async markAsRead(userId, notificationIds = null) {
        try {
            let query = supabase
                .from('notifications')
                .update({ 
                    read_status: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('user_id', userId)
                .eq('read_status', false);

            if (notificationIds && notificationIds.length > 0) {
                query = query.in('id', notificationIds);
            }

            const { error } = await query;

            if (error) {
                console.error('Error marking notifications as read:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in markAsRead:', error);
            return false;
        }
    }

    // Delete notification
    async deleteNotification(userId, notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting notification:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteNotification:', error);
            return false;
        }
    }

    // Notify freelancers about new job
    async notifyNewJob(job) {
        try {
            // Get all approved freelancers
            const { data: freelancers, error } = await supabase
                .from('freelancer_profiles')
                .select('user_id')
                .eq('approval_status', 'approved');

            if (error) {
                console.error('Error fetching freelancers:', error);
                return;
            }

            // Create notifications for each freelancer
            const notifications = freelancers.map(freelancer => ({
                user_id: freelancer.user_id,
                type: 'job_posted',
                title: 'New Job Available',
                message: `A new job "${job.title}" has been posted in ${job.location}`,
                data: {
                    job_id: job.id,
                    job_title: job.title,
                    job_location: job.location,
                    client_id: job.client_id
                }
            }));

            if (notifications.length > 0) {
                const { error: insertError } = await supabase
                    .from('notifications')
                    .insert(notifications);

                if (insertError) {
                    console.error('Error creating job notifications:', insertError);
                } else {
                    // Send real-time notifications
                    notifications.forEach(notification => {
                        this.sendRealtimeNotification(notification.user_id, notification);
                    });
                }
            }
        } catch (error) {
            console.error('Error in notifyNewJob:', error);
        }
    }

    // Notify client about job application
    async notifyJobApplication(application, job, freelancer) {
        try {
            const notification = {
                user_id: job.client_id,
                type: 'job_application',
                title: 'New Job Application',
                message: `${freelancer.email} has applied for your job "${job.title}"`,
                data: {
                    job_id: job.id,
                    job_title: job.title,
                    application_id: application.id,
                    freelancer_id: application.freelancer_id,
                    freelancer_email: freelancer.email,
                    proposed_rate: application.proposed_rate
                }
            };

            const { data, error } = await supabase
                .from('notifications')
                .insert([notification])
                .select()
                .single();

            if (error) {
                console.error('Error creating application notification:', error);
            } else {
                this.sendRealtimeNotification(job.client_id, data);
            }
        } catch (error) {
            console.error('Error in notifyJobApplication:', error);
        }
    }

    // Notify freelancer about application status
    async notifyApplicationStatus(application, job, client, status) {
        try {
            let title, message;
            
            if (status === 'accepted') {
                title = 'Application Approved!';
                message = `Your application for "${job.title}" has been approved by ${client.email}`;
            } else if (status === 'rejected') {
                title = 'Application Not Selected';
                message = `Your application for "${job.title}" was not selected this time`;
            } else {
                return; // Don't notify for other statuses
            }

            const notification = {
                user_id: application.freelancer_id,
                type: status === 'accepted' ? 'application_approved' : 'application_rejected',
                title,
                message,
                data: {
                    job_id: job.id,
                    job_title: job.title,
                    application_id: application.id,
                    client_id: job.client_id,
                    client_email: client.email,
                    proposed_rate: application.proposed_rate
                }
            };

            const { data, error } = await supabase
                .from('notifications')
                .insert([notification])
                .select()
                .single();

            if (error) {
                console.error('Error creating status notification:', error);
            } else {
                this.sendRealtimeNotification(application.freelancer_id, data);
            }
        } catch (error) {
            console.error('Error in notifyApplicationStatus:', error);
        }
    }

    // Notify about job completion
    async notifyJobCompletion(job, freelancerId = null) {
        try {
            const notifications = [];

            // Notify freelancer if exists
            if (freelancerId) {
                notifications.push({
                    user_id: freelancerId,
                    type: 'job_completed',
                    title: 'Job Completed',
                    message: `The job "${job.title}" has been marked as completed`,
                    data: {
                        job_id: job.id,
                        job_title: job.title,
                        client_id: job.client_id
                    }
                });
            }

            // Notify client
            notifications.push({
                user_id: job.client_id,
                type: 'job_completed',
                title: 'Job Completed',
                message: `You have marked the job "${job.title}" as completed`,
                data: {
                    job_id: job.id,
                    job_title: job.title,
                    freelancer_id: freelancerId
                }
            });

            if (notifications.length > 0) {
                const { data, error } = await supabase
                    .from('notifications')
                    .insert(notifications)
                    .select();

                if (error) {
                    console.error('Error creating completion notifications:', error);
                } else {
                    // Send real-time notifications
                    data.forEach(notification => {
                        this.sendRealtimeNotification(notification.user_id, notification);
                    });
                }
            }
        } catch (error) {
            console.error('Error in notifyJobCompletion:', error);
        }
    }

    // Send push notification (for future mobile app integration)
    async sendPushNotification(userId, title, message, data = {}) {
        // This would integrate with a push notification service like Firebase
        // For now, we'll just log it
        console.log(`Push notification for user ${userId}: ${title} - ${message}`);
        
        // TODO: Implement actual push notification service
        // Example with Firebase:
        // const admin = require('firebase-admin');
        // const message = {
        //     notification: { title, body: message },
        //     data: data,
        //     token: userFCMToken
        // };
        // await admin.messaging().send(message);
    }
}

module.exports = new NotificationService();
