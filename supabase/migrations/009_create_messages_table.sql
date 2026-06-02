-- =====================================================
-- Migration: Create messages table
-- Description: Table for customer-provider messaging
-- Created: 2026-05-26
-- =====================================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_sender_recipient CHECK (sender_id != recipient_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
    CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
    CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages

-- Users see messages where they are sender or recipient
CREATE POLICY "Users see their messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can mark their received messages as read
CREATE POLICY "Users can mark messages as read" ON messages
    FOR UPDATE USING (auth.uid() = recipient_id)
    WITH CHECK (
        is_read = TRUE AND
        read_at IS NOT NULL AND
        sender_id = (SELECT sender_id FROM messages WHERE id = messages.id)
    );
