import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import io from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    // Initialize Socket.IO connection
    useEffect(() => {
        if (currentUser) {
            const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
            
            newSocket.on('connect', () => {
                console.log('Connected to notification server');
                // Join user-specific room for notifications
                newSocket.emit('join-user-room', currentUser.id);
            });

            newSocket.on('notification', (notification) => {
                console.log('Received notification:', notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show browser notification if permission is granted
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico',
                        tag: notification.id
                    });
                }
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from notification server');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [currentUser]);

    // Request notification permission
    useEffect(() => {
        if (currentUser && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [currentUser]);

    // Fetch notifications on mount
    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [currentUser]);

    const fetchNotifications = async (page = 1, limit = 20) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/notifications?page=${page}&limit=${limit}`);
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/api/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationIds = null) => {
        try {
            await axios.put('/api/notifications/mark-read', { notification_ids: notificationIds });
            
            if (notificationIds) {
                // Mark specific notifications as read
                setNotifications(prev => 
                    prev.map(notification => 
                        notificationIds.includes(notification.id)
                            ? { ...notification, read_status: true, read_at: new Date().toISOString() }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
            } else {
                // Mark all notifications as read
                setNotifications(prev => 
                    prev.map(notification => ({ 
                        ...notification, 
                        read_status: true, 
                        read_at: new Date().toISOString() 
                    }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/api/notifications/mark-all-read');
            setNotifications(prev => 
                prev.map(notification => ({ 
                    ...notification, 
                    read_status: true, 
                    read_at: new Date().toISOString() 
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/api/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            
            // Update unread count if the deleted notification was unread
            const deletedNotification = notifications.find(n => n.id === notificationId);
            if (deletedNotification && !deletedNotification.read_status) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await axios.delete('/api/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read_status) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
