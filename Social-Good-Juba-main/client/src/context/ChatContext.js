import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [lastUnreadCountFetch, setLastUnreadCountFetch] = useState(0);
    const [lastConversationsFetch, setLastConversationsFetch] = useState(0);
    const [lastMarkAsReadCall, setLastMarkAsReadCall] = useState({});

    // Initialize Socket.IO connection
    useEffect(() => {
        if (currentUser) {
            const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
            
            newSocket.on('connect', () => {
                console.log('Connected to chat server');
                newSocket.emit('user-online', currentUser.id);
            });

            newSocket.on('user-typing', (data) => {
                setTypingUsers(prev => new Set(prev).add(data.username));
            });

            newSocket.on('user-stop-typing', (data) => {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.username);
                    return newSet;
                });
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [currentUser]);

    // Fetch conversations with debouncing
    const fetchConversations = async () => {
        const now = Date.now();
        // Only fetch if it's been more than 10 seconds since last fetch
        if (now - lastConversationsFetch < 10000) {
            return;
        }
        
        try {
            setLastConversationsFetch(now);
            setLoading(true);
            const token = localStorage.getItem('juba_token');
            const response = await axios.get('/api/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('juba_token');
            const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);
            
            // Join conversation room
            if (socket) {
                socket.emit('join-conversation', conversationId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Send a message
    const sendMessage = async (conversationId, content, messageType = 'text', fileData = null) => {
        try {
            const token = localStorage.getItem('juba_token');
            const messageData = {
                content,
                messageType,
                ...(fileData && {
                    fileUrl: fileData.url,
                    fileName: fileData.name,
                    fileSize: fileData.size
                })
            };

            const response = await axios.post(
                `/api/chat/conversations/${conversationId}/messages`,
                messageData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const newMessage = response.data.message;
            setMessages(prev => [...prev, newMessage]);

            // Emit to socket for real-time updates
            if (socket) {
                socket.emit('send-message', {
                    conversationId,
                    message: newMessage
                });
            }

            // Update conversation list with last message
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === conversationId 
                        ? { ...conv, lastMessage: newMessage }
                        : conv
                )
            );

            return newMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    // Create a new conversation
    const createConversation = async (clientId, freelancerId, jobId) => {
        try {
            const token = localStorage.getItem('juba_token');
            const response = await axios.post('/api/chat/conversations', {
                clientId,
                freelancerId,
                jobId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.conversation) {
                setConversations(prev => [response.data.conversation, ...prev]);
                return response.data.conversation;
            } else {
                // Conversation already exists
                return { id: response.data.conversationId };
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    };

    // Mark messages as read with debouncing
    const markAsRead = async (conversationId) => {
        const now = Date.now();
        const lastCall = lastMarkAsReadCall[conversationId] || 0;
        
        // Only mark as read if it's been more than 2 seconds since last call for this conversation
        if (now - lastCall < 2000) {
            return;
        }
        
        try {
            setLastMarkAsReadCall(prev => ({ ...prev, [conversationId]: now }));
            const token = localStorage.getItem('juba_token');
            await axios.put(`/api/chat/conversations/${conversationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setMessages(prev => 
                prev.map(msg => 
                    msg.conversation_id === conversationId 
                        ? { ...msg, is_read: true }
                        : msg
                )
            );

            // Update unread count
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Fetch unread message count with debouncing
    const fetchUnreadCount = async () => {
        const now = Date.now();
        // Only fetch if it's been more than 5 seconds since last fetch
        if (now - lastUnreadCountFetch < 5000) {
            return;
        }
        
        try {
            setLastUnreadCountFetch(now);
            const token = localStorage.getItem('juba_token');
            const response = await axios.get('/api/chat/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Start typing indicator
    const startTyping = (conversationId) => {
        if (socket && currentUser) {
            socket.emit('typing-start', {
                conversationId,
                userId: currentUser.id,
                username: currentUser.username || currentUser.email
            });
        }
    };

    // Stop typing indicator
    const stopTyping = (conversationId) => {
        if (socket && currentUser) {
            socket.emit('typing-stop', {
                conversationId,
                userId: currentUser.id
            });
        }
    };

    // Set active conversation
    const setActiveConv = (conversation) => {
        setActiveConversation(conversation);
        if (conversation) {
            fetchMessages(conversation.id);
        } else {
            setMessages([]);
            // Leave previous conversation room
            if (socket && activeConversation) {
                socket.emit('leave-conversation', activeConversation.id);
            }
        }
    };

    // Get conversation by participants and job
    const getConversation = (clientId, freelancerId, jobId) => {
        return conversations.find(conv => 
            conv.client_id === clientId && 
            conv.freelancer_id === freelancerId && 
            conv.job_id === jobId
        );
    };

    // Get other participant in conversation
    const getOtherParticipant = (conversation) => {
        if (!conversation || !currentUser) return null;
        
        if (conversation.client_id === currentUser.id) {
            return conversation.freelancer;
        } else {
            return conversation.client;
        }
    };

    // Get job info for conversation
    const getJobInfo = (conversation) => {
        return conversation?.jobs;
    };

    // Check if user is typing
    const isUserTyping = (username) => {
        return typingUsers.has(username);
    };

    // Clear typing indicators
    const clearTypingIndicators = () => {
        setTypingUsers(new Set());
    };

    // Refresh conversations (bypasses debouncing)
    const refreshConversations = () => {
        setLastConversationsFetch(0);
        setLastUnreadCountFetch(0);
        fetchConversations();
        fetchUnreadCount();
    };

    // Initial data fetch
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
            fetchUnreadCount();
        }
    }, [currentUser?.id]); // Only depend on user ID, not the entire user object

    const value = {
        socket,
        conversations,
        activeConversation,
        messages,
        unreadCount,
        loading,
        typingUsers,
        fetchConversations,
        fetchMessages,
        sendMessage,
        createConversation,
        markAsRead,
        fetchUnreadCount,
        startTyping,
        stopTyping,
        setActiveConversation: setActiveConv,
        getConversation,
        getOtherParticipant,
        getJobInfo,
        isUserTyping,
        clearTypingIndicators,
        refreshConversations
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
