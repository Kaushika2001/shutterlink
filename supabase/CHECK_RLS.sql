-- =====================================================
-- CHECK RLS POLICIES FOR YOUR service_packages TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'service_packages';

-- Check existing policies
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'service_packages';
