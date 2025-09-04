const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get conversations where user is either client or freelancer
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    description
                ),
                client:users!conversations_client_id_fkey (
                    id,
                    username,
                    email
                ),
                freelancer:users!conversations_freelancer_id_fkey (
                    id,
                    username,
                    email
                )
            `)
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return res.status(500).json({ error: 'Failed to fetch conversations' });
        }

        // Get last message for each conversation
        const conversationsWithLastMessage = await Promise.all(
            conversations.map(async (conv) => {
                const { data: lastMessage } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...conv,
                    lastMessage: lastMessage || null
                };
            })
        );

        res.json({ conversations: conversationsWithLastMessage });
    } catch (error) {
        console.error('Error in conversations endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .single();

        if (convError || !conversation) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Get messages
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }

        // Mark messages as read if they're from the other user
        const unreadMessages = messages.filter(msg => 
            msg.sender_id !== userId && !msg.is_read
        );

        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(msg => msg.id);
            await supabase
                .from('messages')
                .update({ is_read: true })
                .in('id', messageIds);
        }

        res.json({ messages });
    } catch (error) {
        console.error('Error in messages endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
    try {
        const { clientId, freelancerId, jobId } = req.body;
        const userId = req.user.id;

        // Verify user is one of the participants
        if (userId !== clientId && userId !== freelancerId) {
            return res.status(403).json({ error: 'You can only create conversations you are part of' });
        }

        // Check if conversation already exists
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('client_id', clientId)
            .eq('freelancer_id', freelancerId)
            .eq('job_id', jobId)
            .single();

        if (existingConv) {
            return res.json({ conversationId: existingConv.id, message: 'Conversation already exists' });
        }

        // Create new conversation
        const { data: conversation, error } = await supabase
            .from('conversations')
            .insert({
                client_id: clientId,
                freelancer_id: freelancerId,
                job_id: jobId
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating conversation:', error);
            return res.status(500).json({ error: 'Failed to create conversation' });
        }

        res.status(201).json({ conversation });
    } catch (error) {
        console.error('Error in create conversation endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, messageType = 'text', fileUrl, fileName, fileSize } = req.body;
        const userId = req.user.id;

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .single();

        if (convError || !conversation) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Create message
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content,
                message_type: messageType,
                file_url: fileUrl,
                file_name: fileName,
                file_size: fileSize
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating message:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }

        // Get sender info
        const { data: sender } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', userId)
            .single();

        const messageWithSender = {
            ...message,
            sender: sender
        };

        res.status(201).json({ message: messageWithSender });
    } catch (error) {
        console.error('Error in send message endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .single();

        if (convError || !conversation) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Mark unread messages as read
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);

        if (error) {
            console.error('Error marking messages as read:', error);
            return res.status(500).json({ error: 'Failed to mark messages as read' });
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in mark as read endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get unread message count for a user
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get conversations where user is participant
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`);

        if (!conversations || conversations.length === 0) {
            return res.json({ unreadCount: 0 });
        }

        const conversationIds = conversations.map(conv => conv.id);

        // Count unread messages
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error counting unread messages:', error);
            return res.status(500).json({ error: 'Failed to count unread messages' });
        }

        res.json({ unreadCount: count || 0 });
    } catch (error) {
        console.error('Error in unread count endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
