-- =====================================================
-- Migration: Create reviews table
-- Description: Table to store reviews and ratings for providers
-- Created: 2026-05-26
-- =====================================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews

-- Anyone can see published reviews
CREATE POLICY "Anyone see published reviews" ON reviews
    FOR SELECT USING (is_flagged = FALSE);

-- Customers and providers see all their reviews
CREATE POLICY "Users see their reviews" ON reviews
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id)
    WITH CHECK (TRUE);

-- Admins see all reviews including flagged
CREATE POLICY "Admins see all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Customers can create reviews for their bookings
CREATE POLICY "Customers can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id AND 
        EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.status = 'completed')
    );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = customer_id);

-- Admins can flag/unflag reviews
CREATE POLICY "Admins can manage reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
