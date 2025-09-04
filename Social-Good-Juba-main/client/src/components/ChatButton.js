import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ChatWindow from './ChatWindow';
import './ChatButton.css';

const ChatButton = ({ 
    clientId, 
    freelancerId, 
    jobId, 
    jobTitle, 
    className = '', 
    variant = 'default',
    children 
}) => {
    const { currentUser } = useAuth();
    const { getConversation, createConversation, setActiveConversation } = useChat();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStartChat = async () => {
        if (!currentUser) return;
        
        setIsLoading(true);
        try {
            // Check if conversation already exists
            let conversation = getConversation(clientId, freelancerId, jobId);
            
            if (!conversation) {
                // Create new conversation
                conversation = await createConversation(clientId, freelancerId, jobId);
            }
            
            // Open chat with this conversation
            setActiveConversation(conversation);
            setIsChatOpen(true);
        } catch (error) {
            console.error('Error starting chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show button if user is trying to chat with themselves
    if (currentUser && (currentUser.id === clientId && currentUser.id === freelancerId)) {
        return null;
    }

    const buttonClass = `chat-start-button ${variant} ${className}`.trim();

    return (
        <>
            <button
                className={buttonClass}
                onClick={handleStartChat}
                disabled={isLoading}
                title={`Chat about: ${jobTitle}`}
            >
                {isLoading ? (
                    <div className="chat-loading-spinner"></div>
                ) : (
                    <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {children || 'Chat'}
                    </>
                )}
            </button>

            <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
};

export default ChatButton;
