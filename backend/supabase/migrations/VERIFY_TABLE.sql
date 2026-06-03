-- =====================================================
-- VERIFY SERVICE_PACKAGES TABLE STRUCTURE
-- Run this in Supabase SQL Editor to check your table
-- =====================================================

-- 1. Check if table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'service_packages';

-- 2. Check all columns and their types
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'service_packages'
ORDER BY ordinal_position;

-- 3. Check constraints (like CHECK on price)
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'service_packages'
AND nsp.nspname = 'public';

-- 4. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'service_packages'
AND schemaname = 'public';

-- 5. Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'service_packages'
AND schemaname = 'public';

-- 6. Check RLS policies
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'service_packages'
AND schemaname = 'public';

-- 7. Check foreign key relationships
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'service_packages';

-- 8. Check if service_type enum exists
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'service_type_enum'
ORDER BY e.enumsortorder;

-- 9. Check triggers
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'service_packages'
AND trigger_schema = 'public';

-- 10. Sample data (check if any records exist)
SELECT 
    COUNT(*) as total_packages,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_packages,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_packages
FROM service_packages;
