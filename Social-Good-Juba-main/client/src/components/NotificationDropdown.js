import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
    const { 
        notifications, 
        unreadCount, 
        loading, 
        fetchNotifications, 
        markAllAsRead 
    } = useNotifications();
    
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Fetch notifications when dropdown opens
        fetchNotifications();
        
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [fetchNotifications, onClose]);

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                    <button 
                        className="mark-all-read-btn"
                        onClick={handleMarkAllRead}
                    >
                        Mark all read
                    </button>
                )}
            </div>
            
            <div className="notification-list">
                {loading ? (
                    <div className="loading-text">
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))
                )}
            </div>
            
            {notifications.length > 10 && (
                <div className="notification-footer">
                    <button className="view-all-btn">
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
