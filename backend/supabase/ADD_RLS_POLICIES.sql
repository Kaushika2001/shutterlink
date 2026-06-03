-- =====================================================
-- ADD RLS POLICIES TO YOUR EXISTING service_packages TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS (if not already enabled)
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "view_active_packages" ON service_packages;
DROP POLICY IF EXISTS "manage_own_packages" ON service_packages;
DROP POLICY IF EXISTS "providers_view_own_packages" ON service_packages;
DROP POLICY IF EXISTS "providers_create_packages" ON service_packages;
DROP POLICY IF EXISTS "providers_update_packages" ON service_packages;
DROP POLICY IF EXISTS "providers_delete_packages" ON service_packages;

-- Step 3: Create policies

-- Policy 1: Anyone can view active packages (for public browsing)
CREATE POLICY "view_active_packages"
ON service_packages
FOR SELECT
USING (is_active = true);

-- Policy 2: Providers can view all their own packages (including inactive)
CREATE POLICY "providers_view_own_packages"
ON service_packages
FOR SELECT
USING (
    provider_id IN (
        SELECT id FROM provider_profiles 
        WHERE user_id = auth.uid()
    )
);

-- Policy 3: Providers can create their own packages
CREATE POLICY "providers_create_packages"
ON service_packages
FOR INSERT
WITH CHECK (
    provider_id IN (
        SELECT id FROM provider_profiles 
        WHERE user_id = auth.uid()
    )
);

-- Policy 4: Providers can update their own packages
CREATE POLICY "providers_update_packages"
ON service_packages
FOR UPDATE
USING (
    provider_id IN (
        SELECT id FROM provider_profiles 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    provider_id IN (
        SELECT id FROM provider_profiles 
        WHERE user_id = auth.uid()
    )
);

-- Policy 5: Providers can delete their own packages
CREATE POLICY "providers_delete_packages"
ON service_packages
FOR DELETE
USING (
    provider_id IN (
        SELECT id FROM provider_profiles 
        WHERE user_id = auth.uid()
    )
);

-- Step 4: Verify policies were created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'service_packages';

-- Step 5: Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'service_packages';
