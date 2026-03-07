-- =====================================================
-- QUICK SETUP FOR SERVICE PACKAGES TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create service_type enum
CREATE TYPE service_type_enum AS ENUM ('photography', 'editing', 'both');

-- Step 2: Create service_packages table
CREATE TABLE service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    service_type service_type_enum NOT NULL,
    duration_hours DECIMAL(4,2),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    deliverables TEXT[] DEFAULT '{}',
    max_revisions INTEGER NOT NULL DEFAULT 0 CHECK (max_revisions >= 0),
    turnaround_days INTEGER CHECK (turnaround_days >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_service_packages_provider_id ON service_packages(provider_id);
CREATE INDEX idx_service_packages_is_active ON service_packages(is_active);

-- Step 4: Enable RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies

-- Anyone can view active packages
CREATE POLICY "view_active_packages"
    ON service_packages FOR SELECT
    USING (is_active = TRUE);

-- Providers can manage their own packages
CREATE POLICY "manage_own_packages"
    ON service_packages FOR ALL
    USING (auth.uid() = provider_id);
