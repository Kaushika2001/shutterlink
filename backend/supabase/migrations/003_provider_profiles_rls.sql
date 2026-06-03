-- ============================================
-- PROVIDER PROFILES RLS POLICIES
-- ============================================
-- Row Level Security policies for provider_profiles table
-- Note: The provider_profiles table already exists (you provided the schema)
-- This file only adds RLS policies

-- Enable RLS on provider_profiles
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy 1: Anyone can view provider profiles (public browsing)
CREATE POLICY "Anyone can view provider profiles"
  ON public.provider_profiles
  FOR SELECT
  USING (true);

-- Policy 2: Users can insert their own provider profile (one-time setup)
CREATE POLICY "Users can create own provider profile"
  ON public.provider_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.user_id = auth.uid()
    )
  );

-- Policy 3: Providers can update their own profile
CREATE POLICY "Providers can update own profile"
  ON public.provider_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Providers can delete their own profile
CREATE POLICY "Providers can delete own profile"
  ON public.provider_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 5: Admins can manage all profiles (optional - for admin panel)
CREATE POLICY "Admins can manage all profiles"
  ON public.provider_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has provider profile
CREATE OR REPLACE FUNCTION public.has_provider_profile(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.provider_profiles
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get provider_profile_id from user_id
CREATE OR REPLACE FUNCTION public.get_provider_profile_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id
  FROM public.provider_profiles
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
