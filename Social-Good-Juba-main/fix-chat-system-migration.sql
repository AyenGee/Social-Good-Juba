-- Fix Chat System Migration
-- This script migrates the existing database to support the new chat system

-- First, let's check if the conversations table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        -- Create conversations table
        CREATE TABLE conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID REFERENCES users(id) ON DELETE CASCADE,
            freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
            job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(client_id, freelancer_id, job_id)
        );
        
        RAISE NOTICE 'Created conversations table';
    ELSE
        RAISE NOTICE 'Conversations table already exists';
    END IF;
END $$;

-- Check if messages table has the old structure
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'job_id') THEN
        -- Backup old messages data
        CREATE TABLE IF NOT EXISTS messages_backup AS SELECT * FROM messages;
        RAISE NOTICE 'Created backup of old messages table';
        
        -- Drop old messages table
        DROP TABLE messages;
        RAISE NOTICE 'Dropped old messages table';
        
        -- Create new messages table with conversation_id
        CREATE TABLE messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
            file_url TEXT,
            file_name TEXT,
            file_size INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created new messages table with conversation_id';
        
        -- Migrate existing messages data if there's any
        INSERT INTO conversations (client_id, freelancer_id, job_id, created_at, updated_at)
        SELECT DISTINCT 
            j.client_id,
            m.sender_id as freelancer_id,
            m.job_id,
            MIN(m.timestamp) as created_at,
            MAX(m.timestamp) as updated_at
        FROM messages_backup m
        JOIN jobs j ON m.job_id = j.id
        GROUP BY j.client_id, m.sender_id, m.job_id;
        
        -- Insert messages with new structure
        INSERT INTO messages (conversation_id, sender_id, content, created_at, is_read)
        SELECT 
            c.id as conversation_id,
            m.sender_id,
            m.content,
            m.timestamp as created_at,
            m.read_status as is_read
        FROM messages_backup m
        JOIN conversations c ON m.job_id = c.job_id;
        
        RAISE NOTICE 'Migrated existing messages data';
        
    ELSE
        RAISE NOTICE 'Messages table already has new structure or does not exist';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_freelancer_id ON conversations(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id
    );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id
    );

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id
    );

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (auth.uid() = client_id OR auth.uid() = freelancer_id)
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (auth.uid() = client_id OR auth.uid() = freelancer_id)
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        auth.uid() = sender_id
    );

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp when new message is added
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    email TEXT,
    is_client BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.client_id as user_id,
        u1.username,
        u1.email,
        TRUE as is_client
    FROM conversations c
    JOIN users u1 ON c.client_id = u1.id
    WHERE c.id = conv_id
    
    UNION ALL
    
    SELECT 
        c.freelancer_id as user_id,
        u2.username,
        u2.email,
        FALSE as is_client
    FROM conversations c
    JOIN users u2 ON c.freelancer_id = u2.id
    WHERE c.id = conv_id;
END;
$$ LANGUAGE plpgsql;

-- Add username field to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'Added username column to users table';
    ELSE
        RAISE NOTICE 'Username column already exists in users table';
    END IF;
END $$;

-- Clean up backup table after successful migration
-- DROP TABLE IF EXISTS messages_backup;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE 'Chat system migration completed successfully!';
END $$;
