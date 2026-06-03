-- =====================================================
-- Migration: Fix bookings missing columns
-- Description: Ensures created_at and updated_at exist
-- =====================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
