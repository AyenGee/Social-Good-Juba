-- Notifications System Setup
-- This script creates the notifications table and related functionality

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('job_posted', 'job_application', 'application_approved', 'application_rejected', 'job_completed', 'payment_received', 'message_received')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like job_id, application_id, etc.
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to notify freelancers about new jobs
CREATE OR REPLACE FUNCTION notify_freelancers_new_job()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notifications for all approved freelancers
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        fp.user_id,
        'job_posted',
        'New Job Available',
        'A new job "' || NEW.title || '" has been posted in ' || NEW.location,
        jsonb_build_object(
            'job_id', NEW.id,
            'job_title', NEW.title,
            'job_location', NEW.location,
            'client_id', NEW.client_id
        )
    FROM freelancer_profiles fp
    WHERE fp.approval_status = 'approved';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new job notifications
DROP TRIGGER IF EXISTS trigger_notify_freelancers_new_job ON jobs;
CREATE TRIGGER trigger_notify_freelancers_new_job
    AFTER INSERT ON jobs
    FOR EACH ROW
    WHEN (NEW.status = 'posted')
    EXECUTE FUNCTION notify_freelancers_new_job();

-- Create function to notify clients about job applications
CREATE OR REPLACE FUNCTION notify_client_job_application()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    freelancer_email TEXT;
BEGIN
    -- Get job title and freelancer email
    SELECT j.title, u.email INTO job_title, freelancer_email
    FROM jobs j
    JOIN users u ON u.id = NEW.freelancer_id
    WHERE j.id = NEW.job_id;
    
    -- Insert notification for the client
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        j.client_id,
        'job_application',
        'New Job Application',
        freelancer_email || ' has applied for your job "' || job_title || '"',
        jsonb_build_object(
            'job_id', NEW.job_id,
            'job_title', job_title,
            'application_id', NEW.id,
            'freelancer_id', NEW.freelancer_id,
            'freelancer_email', freelancer_email,
            'proposed_rate', NEW.proposed_rate
        )
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job application notifications
DROP TRIGGER IF EXISTS trigger_notify_client_job_application ON job_applications;
CREATE TRIGGER trigger_notify_client_job_application
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_job_application();

-- Create function to notify freelancer about application status
CREATE OR REPLACE FUNCTION notify_freelancer_application_status()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    client_email TEXT;
BEGIN
    -- Only notify on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get job title and client email
        SELECT j.title, u.email INTO job_title, client_email
        FROM jobs j
        JOIN users u ON u.id = j.client_id
        WHERE j.id = NEW.job_id;
        
        -- Insert notification based on status
        IF NEW.status = 'accepted' THEN
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                NEW.freelancer_id,
                'application_approved',
                'Application Approved!',
                'Your application for "' || job_title || '" has been approved by ' || client_email,
                jsonb_build_object(
                    'job_id', NEW.job_id,
                    'job_title', job_title,
                    'application_id', NEW.id,
                    'client_id', (SELECT client_id FROM jobs WHERE id = NEW.job_id),
                    'client_email', client_email,
                    'proposed_rate', NEW.proposed_rate
                )
            );
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                NEW.freelancer_id,
                'application_rejected',
                'Application Not Selected',
                'Your application for "' || job_title || '" was not selected this time',
                jsonb_build_object(
                    'job_id', NEW.job_id,
                    'job_title', job_title,
                    'application_id', NEW.id,
                    'client_id', (SELECT client_id FROM jobs WHERE id = NEW.job_id),
                    'client_email', client_email
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status notifications
DROP TRIGGER IF EXISTS trigger_notify_freelancer_application_status ON job_applications;
CREATE TRIGGER trigger_notify_freelancer_application_status
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_freelancer_application_status();

-- Create function to notify about job completion
CREATE OR REPLACE FUNCTION notify_job_completion()
RETURNS TRIGGER AS $$
DECLARE
    freelancer_id UUID;
    client_email TEXT;
BEGIN
    -- Only notify on status change to completed
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
        -- Get the accepted freelancer
        SELECT ja.freelancer_id INTO freelancer_id
        FROM job_applications ja
        WHERE ja.job_id = NEW.id AND ja.status = 'accepted'
        LIMIT 1;
        
        -- Get client email
        SELECT u.email INTO client_email
        FROM users u
        WHERE u.id = NEW.client_id;
        
        -- Notify freelancer
        IF freelancer_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                freelancer_id,
                'job_completed',
                'Job Completed',
                'The job "' || NEW.title || '" has been marked as completed by ' || client_email,
                jsonb_build_object(
                    'job_id', NEW.id,
                    'job_title', NEW.title,
                    'client_id', NEW.client_id,
                    'client_email', client_email
                )
            );
        END IF;
        
        -- Notify client
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.client_id,
            'job_completed',
            'Job Completed',
            'You have marked the job "' || NEW.title || '" as completed',
            jsonb_build_object(
                'job_id', NEW.id,
                'job_title', NEW.title,
                'freelancer_id', freelancer_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job completion notifications
DROP TRIGGER IF EXISTS trigger_notify_job_completion ON jobs;
CREATE TRIGGER trigger_notify_job_completion
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_completion();

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = user_uuid AND read_status = FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(user_uuid UUID, notification_ids UUID[] DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF notification_ids IS NULL THEN
        -- Mark all notifications as read
        UPDATE notifications
        SET read_status = TRUE, read_at = NOW()
        WHERE user_id = user_uuid AND read_status = FALSE;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications
        SET read_status = TRUE, read_at = NOW()
        WHERE user_id = user_uuid AND id = ANY(notification_ids);
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
