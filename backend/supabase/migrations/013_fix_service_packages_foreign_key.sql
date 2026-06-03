-- =====================================================
-- Migration: Fix service_packages foreign key
-- Description: Changes provider_id FK from auth.users to provider_profiles
--              and updates RLS policies to match
-- =====================================================

-- Step 1: Drop existing FK constraint (auto-named by Postgres)
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_provider_id_fkey;

-- Step 2: Clean up any rows where provider_id doesn't exist in provider_profiles
DELETE FROM service_packages
WHERE provider_id IS NOT NULL
  AND provider_id NOT IN (SELECT id FROM public.provider_profiles);

-- Step 3: Add correct FK constraint referencing provider_profiles
ALTER TABLE service_packages
  ADD CONSTRAINT service_packages_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.provider_profiles(id)
  ON DELETE CASCADE;

-- Step 4: Drop old RLS policies that compare auth.uid() directly to provider_id
DROP POLICY IF EXISTS "Providers can view their own packages" ON service_packages;
DROP POLICY IF EXISTS "Providers can create their own packages" ON service_packages;
DROP POLICY IF EXISTS "Providers can update their own packages" ON service_packages;
DROP POLICY IF EXISTS "Providers can delete their own packages" ON service_packages;

-- Step 5: Recreate RLS policies using provider_profiles lookup
CREATE POLICY "Providers can view their own packages"
    ON service_packages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.provider_profiles
            WHERE provider_profiles.id = service_packages.provider_id
            AND provider_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can create their own packages"
    ON service_packages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.provider_profiles
            WHERE provider_profiles.id = service_packages.provider_id
            AND provider_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can update their own packages"
    ON service_packages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.provider_profiles
            WHERE provider_profiles.id = service_packages.provider_id
            AND provider_profiles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.provider_profiles
            WHERE provider_profiles.id = service_packages.provider_id
            AND provider_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can delete their own packages"
    ON service_packages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.provider_profiles
            WHERE provider_profiles.id = service_packages.provider_id
            AND provider_profiles.user_id = auth.uid()
        )
    );
