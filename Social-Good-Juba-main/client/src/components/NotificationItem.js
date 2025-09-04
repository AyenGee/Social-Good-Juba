import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationItem.css';

const NotificationItem = ({ notification, formatTimeAgo }) => {
    const { markAsRead, deleteNotification } = useNotifications();
    const navigate = useNavigate();

    const handleClick = async () => {
        // Mark as read if unread
        if (!notification.read_status) {
            await markAsRead([notification.id]);
        }

        // Navigate based on notification type and data
        if (notification.data) {
            switch (notification.type) {
                case 'job_posted':
                    if (notification.data.job_id) {
                        navigate(`/job/${notification.data.job_id}`);
                    }
                    break;
                case 'job_application':
                    if (notification.data.job_id) {
                        navigate(`/job/${notification.data.job_id}`);
                    }
                    break;
                case 'application_approved':
                case 'application_rejected':
                    if (notification.data.job_id) {
                        navigate(`/job/${notification.data.job_id}`);
                    }
                    break;
                case 'job_completed':
                    if (notification.data.job_id) {
                        navigate(`/job/${notification.data.job_id}`);
                    }
                    break;
                default:
                    navigate('/dashboard');
            }
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        await deleteNotification(notification.id);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'job_posted':
                return '💼';
            case 'job_application':
                return '📝';
            case 'application_approved':
                return '✅';
            case 'application_rejected':
                return '❌';
            case 'job_completed':
                return '🎉';
            case 'payment_received':
                return '💰';
            case 'message_received':
                return '💬';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'job_posted':
                return '#4CAF50';
            case 'job_application':
                return '#2196F3';
            case 'application_approved':
                return '#4CAF50';
            case 'application_rejected':
                return '#F44336';
            case 'job_completed':
                return '#FF9800';
            case 'payment_received':
                return '#4CAF50';
            case 'message_received':
                return '#9C27B0';
            default:
                return '#666';
        }
    };

    return (
        <div 
            className={`notification-item ${!notification.read_status ? 'unread' : ''}`}
            onClick={handleClick}
        >
            <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                {getNotificationIcon(notification.type)}
            </div>
            
            <div className="notification-content">
                <div className="notification-title">
                    {notification.title}
                </div>
                <div className="notification-message">
                    {notification.message}
                </div>
                <div className="notification-time">
                    {formatTimeAgo(notification.created_at)}
                </div>
            </div>
            
            <div className="notification-actions">
                <button 
                    className="delete-btn"
                    onClick={handleDelete}
                    aria-label="Delete notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default NotificationItem;
