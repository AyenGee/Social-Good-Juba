import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import './Notifications.css';

const Notifications = () => {
    const { 
        notifications, 
        unreadCount, 
        loading, 
        fetchNotifications, 
        markAllAsRead,
        clearAllNotifications 
    } = useNotifications();
    
    const [filter, setFilter] = useState('all'); // 'all', 'unread'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchNotifications(page);
    }, [page, fetchNotifications]);

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

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            await clearAllNotifications();
        }
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') {
            return !notification.read_status;
        }
        return true;
    });

    const getNotificationStats = () => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.read_status).length;
        const read = total - unread;
        
        return { total, unread, read };
    };

    const stats = getNotificationStats();

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <h1>Notifications</h1>
                <div className="notification-stats">
                    <div className="stat-item">
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.unread}</span>
                        <span className="stat-label">Unread</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.read}</span>
                        <span className="stat-label">Read</span>
                    </div>
                </div>
            </div>

            <div className="notifications-controls">
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({stats.total})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread ({stats.unread})
                    </button>
                </div>

                <div className="action-buttons">
                    {stats.unread > 0 && (
                        <button 
                            className="action-btn mark-read-btn"
                            onClick={handleMarkAllRead}
                        >
                            Mark All Read
                        </button>
                    )}
                    {stats.total > 0 && (
                        <button 
                            className="action-btn clear-all-btn"
                            onClick={handleClearAll}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-content">
                {loading && notifications.length === 0 ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <h3>No notifications</h3>
                        <p>
                            {filter === 'unread' 
                                ? "You're all caught up! No unread notifications."
                                : "You don't have any notifications yet."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {filteredNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                formatTimeAgo={formatTimeAgo}
                            />
                        ))}
                        
                        {hasMore && (
                            <div className="load-more-container">
                                <button 
                                    className="load-more-btn"
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
