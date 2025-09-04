import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import './ChatWindow.css';

const ChatWindow = ({ isOpen, onClose }) => {
    const {
        conversations,
        activeConversation,
        messages,
        loading,
        setActiveConversation,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
        isUserTyping,
        getOtherParticipant,
        getJobInfo
    } = useChat();

    const { currentUser } = useAuth();
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when conversation is active
    useEffect(() => {
        if (activeConversation) {
            // Add a small delay to prevent rapid API calls
            const timer = setTimeout(() => {
                markAsRead(activeConversation.id);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeConversation?.id]); // Only depend on conversation ID, not the entire function

    // Handle typing indicator
    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        
        if (!isTyping) {
            setIsTyping(true);
            startTyping(activeConversation.id);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            stopTyping(activeConversation.id);
        }, 1000);
    };

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConversation) return;

        try {
            await sendMessage(activeConversation.id, messageInput.trim());
            setMessageInput('');
            setIsTyping(false);
            stopTyping(activeConversation.id);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    // Get conversation display name
    const getConversationName = (conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const jobInfo = getJobInfo(conversation);
        
        if (otherUser) {
            return `${otherUser.username || otherUser.email} - ${jobInfo?.title || 'Job Discussion'}`;
        }
        return 'Unknown User';
    };

    // Get last message preview
    const getLastMessagePreview = (conversation) => {
        if (!conversation.lastMessage) return 'No messages yet';
        
        const content = conversation.lastMessage.content;
        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    };

    if (!isOpen) return null;

    // Render chat window at root level using portal
    return createPortal(
        <div className="chat-window-overlay" onClick={onClose}>
            <div className="chat-window" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <h3>Messages</h3>
                    <button className="chat-close-btn" onClick={onClose}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="chat-content">
                    {/* Conversations List */}
                    <div className="conversations-list">
                        <h4>Conversations</h4>
                        {loading ? (
                            <div className="loading-spinner">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="no-conversations">
                                <p>No conversations yet</p>
                                <p>Start chatting when you apply to jobs or post jobs!</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
                                    onClick={() => setActiveConversation(conversation)}
                                >
                                    <div className="conversation-avatar">
                                        {getOtherParticipant(conversation)?.username?.charAt(0).toUpperCase() || 
                                         getOtherParticipant(conversation)?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-name">
                                            {getConversationName(conversation)}
                                        </div>
                                        <div className="conversation-preview">
                                            {getLastMessagePreview(conversation)}
                                        </div>
                                        <div className="conversation-time">
                                            {conversation.lastMessage ? formatTime(conversation.lastMessage.created_at) : ''}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="messages-area">
                        {activeConversation ? (
                            <>
                                {/* Conversation Header */}
                                <div className="conversation-header">
                                    <div className="conversation-participant">
                                        <div className="participant-avatar">
                                            {getOtherParticipant(activeConversation)?.username?.charAt(0).toUpperCase() || 
                                             getOtherParticipant(activeConversation)?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="participant-info">
                                            <div className="participant-name">
                                                {getOtherParticipant(activeConversation)?.username || 
                                                 getOtherParticipant(activeConversation)?.email}
                                            </div>
                                            <div className="job-title">
                                                {getJobInfo(activeConversation)?.title}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="messages-container">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`message ${message.sender_id === currentUser.id ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-content">
                                                {message.message_type === 'file' ? (
                                                    <div className="file-message">
                                                        <div className="file-icon">📎</div>
                                                        <div className="file-info">
                                                            <div className="file-name">{message.file_name}</div>
                                                            <div className="file-size">
                                                                {(message.file_size / 1024).toFixed(1)} KB
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={message.file_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="file-download"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                ) : (
                                                    message.content
                                                )}
                                            </div>
                                            <div className="message-time">
                                                {formatTime(message.created_at)}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Typing indicator */}
                                    {isUserTyping(getOtherParticipant(activeConversation)?.username || 
                                                 getOtherParticipant(activeConversation)?.email) && (
                                        <div className="message received">
                                            <div className="message-content typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form className="message-input-form" onSubmit={handleSendMessage}>
                                    <div className="message-input-container">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={handleTyping}
                                            placeholder="Type your message..."
                                            className="message-input"
                                            disabled={!activeConversation}
                                        />
                                        <button
                                            type="submit"
                                            className="send-button"
                                            disabled={!messageInput.trim() || !activeConversation}
                                        >
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="no-conversation-selected">
                                <div className="no-conversation-icon">💬</div>
                                <h3>Select a conversation</h3>
                                <p>Choose a conversation from the list to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ChatWindow;
