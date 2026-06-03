-- =====================================================
-- Migration: Create service_packages table
-- Description: Table to store service packages offered by providers
-- Created: 2026-03-06
-- =====================================================

-- Create service_type enum
DO $$ BEGIN
    CREATE TYPE service_type_enum AS ENUM ('photography', 'editing', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create service_packages table
CREATE TABLE IF NOT EXISTS service_packages (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_packages_provider_id ON service_packages(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_service_type ON service_packages(service_type);
CREATE INDEX IF NOT EXISTS idx_service_packages_is_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_price ON service_packages(price);

-- Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_packages_updated_at
    BEFORE UPDATE ON service_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active packages (for public browsing)
CREATE POLICY "Anyone can view active service packages"
    ON service_packages
    FOR SELECT
    USING (is_active = TRUE);

-- Policy: Providers can view all their own packages (active and inactive)
CREATE POLICY "Providers can view their own packages"
    ON service_packages
    FOR SELECT
    USING (auth.uid() = provider_id);

-- Policy: Providers can create their own packages
CREATE POLICY "Providers can create their own packages"
    ON service_packages
    FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

-- Policy: Providers can update their own packages
CREATE POLICY "Providers can update their own packages"
    ON service_packages
    FOR UPDATE
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);

-- Policy: Providers can delete their own packages
CREATE POLICY "Providers can delete their own packages"
    ON service_packages
    FOR DELETE
    USING (auth.uid() = provider_id);

-- Policy: Admins can view all packages
CREATE POLICY "Admins can view all packages"
    ON service_packages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can manage all packages
CREATE POLICY "Admins can manage all packages"
    ON service_packages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get active packages for a provider
CREATE OR REPLACE FUNCTION get_active_packages_by_provider(provider_uuid UUID)
RETURNS SETOF service_packages AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM service_packages
    WHERE provider_id = provider_uuid
    AND is_active = TRUE
    ORDER BY price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count packages for a provider
CREATE OR REPLACE FUNCTION count_packages_by_provider(provider_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    package_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO package_count
    FROM service_packages
    WHERE provider_id = provider_uuid;
    RETURN package_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Uncomment below to insert sample packages (replace UUIDs with actual provider IDs)
/*
INSERT INTO service_packages (provider_id, name, description, service_type, duration_hours, price, deliverables, max_revisions, turnaround_days, is_active)
VALUES
    ('PROVIDER_UUID_HERE', 'Wedding Photography Premium', 'Full day wedding coverage with premium editing', 'photography', 8.00, 150000.00, 
     ARRAY['300+ edited photos', 'Online gallery', 'Print rights', 'Engagement shoot'], 2, 14, TRUE),
    ('PROVIDER_UUID_HERE', 'Portrait Session Basic', 'One hour portrait photography session', 'photography', 1.00, 15000.00,
     ARRAY['20 edited photos', 'Online gallery', 'Digital download'], 1, 7, TRUE),
    ('PROVIDER_UUID_HERE', 'Photo Editing - 50 Images', 'Professional photo editing service', 'editing', NULL, 10000.00,
     ARRAY['50 photos edited', 'Color correction', 'Skin retouching', 'Background cleanup'], 3, 5, TRUE);
*/

-- =====================================================
-- Verification Queries (Run these to verify setup)
-- =====================================================

-- Check if table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'service_packages';

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'service_packages';

-- Check if policies were created
-- SELECT policyname FROM pg_policies WHERE tablename = 'service_packages';

-- Check if triggers were created
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'service_packages';
