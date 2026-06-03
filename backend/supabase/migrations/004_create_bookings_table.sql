-- =====================================================
-- Migration: Create bookings table
-- Description: Table to store booking records for photography services
-- Created: 2026-05-26
-- =====================================================

-- Create booking_status enum
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
    status booking_status_enum DEFAULT 'pending',
    booking_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    requirements TEXT,
    notes TEXT,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings

-- Customers can see their own bookings
CREATE POLICY "Customers see own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id);

-- Providers can see their bookings
CREATE POLICY "Providers see their bookings" ON bookings
    FOR SELECT USING (auth.uid() = provider_id);

-- Admins see all bookings
CREATE POLICY "Admins see all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Customers can create bookings
CREATE POLICY "Customers can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own bookings (cancel)
CREATE POLICY "Customers can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = customer_id);

-- Providers can update bookings assigned to them
CREATE POLICY "Providers can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = provider_id);

-- Admins can update any booking
CREATE POLICY "Admins can update all bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
