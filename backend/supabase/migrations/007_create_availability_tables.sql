-- =====================================================
-- Migration: Create availability tables
-- Description: Tables for managing provider availability and blocked dates
-- Created: 2026-05-26
-- =====================================================

-- Create availability_schedules table
CREATE TABLE IF NOT EXISTS availability_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_blocked_date UNIQUE (provider_id, blocked_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_availability_provider_id ON availability_schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_provider_id ON blocked_dates(provider_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_blocked_date ON blocked_dates(blocked_date);

-- Create updated_at trigger for availability_schedules
CREATE TRIGGER update_availability_schedules_updated_at
    BEFORE UPDATE ON availability_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for availability_schedules

-- Anyone can see active availability schedules
CREATE POLICY "Anyone see active availability" ON availability_schedules
    FOR SELECT USING (is_active = TRUE);

-- Providers can see their own availability
CREATE POLICY "Providers see own availability" ON availability_schedules
    FOR SELECT USING (auth.uid() = provider_id);

-- Providers can manage their own availability
CREATE POLICY "Providers manage own availability" ON availability_schedules
    FOR ALL USING (auth.uid() = provider_id);

-- Admins can view all availability
CREATE POLICY "Admins see all availability" ON availability_schedules
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- RLS Policies for blocked_dates

-- Anyone can see blocked dates
CREATE POLICY "Anyone see blocked dates" ON blocked_dates
    FOR SELECT USING (TRUE);

-- Providers can manage their own blocked dates
CREATE POLICY "Providers manage blocked dates" ON blocked_dates
    FOR ALL USING (auth.uid() = provider_id);

-- Admins can see all blocked dates
CREATE POLICY "Admins see all blocked dates" ON blocked_dates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
