-- =====================================================
-- Migration 015: Add saved_providers table + availability_status
-- =====================================================

-- Saved providers (bookmarks) for customers
CREATE TABLE IF NOT EXISTS saved_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_providers_user_id ON saved_providers(user_id);

-- Add availability_status to provider_profiles if not exists
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';

-- Indexes for reviews, payments, notifications, messages are already in migration 004-009

-- Enable RLS on saved_providers
ALTER TABLE saved_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_providers
CREATE POLICY "Users can manage their own saved providers"
  ON saved_providers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
