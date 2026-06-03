-- =====================================================
-- Fix bookings table: Add missing columns
-- Run this in Supabase SQL Editor
-- =====================================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_number VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_time TIME;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_type VARCHAR(50) DEFAULT 'on_site';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_address TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make booking_number unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_number ON public.bookings(booking_number);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
