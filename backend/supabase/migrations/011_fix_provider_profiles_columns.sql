-- =====================================================
-- Fix provider_profiles: Add missing columns
-- Run this in Supabase SQL Editor
-- =====================================================

ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS social_urls JSONB DEFAULT '{}';
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS equipment_list TEXT[] DEFAULT '{}';
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS coverage_areas TEXT[] DEFAULT '{}';
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS max_travel_distance INTEGER DEFAULT 0;
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
