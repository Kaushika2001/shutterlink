-- =====================================================
-- CLEAR ALL TEST DATA (keeps table structure)
-- Run in Supabase → SQL Editor
-- WARNING: Deletes ALL rows in public tables below.
-- Auth users (login accounts) are NOT removed here — see step 2 in MANUAL_TEST_GUIDE.md
-- =====================================================

BEGIN;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'messages',
    'notifications',
    'reviews',
    'payments',
    'disputes',
    'audit_logs',
    'password_resets',
    'saved_providers',
    'blocked_dates',
    'availability_schedules',
    'bookings',
    'portfolio_items',
    'service_packages',
    'provider_profiles',
    'users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
      RAISE NOTICE 'Truncated: %', t;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Skipped (no table): %', t;
    END;
  END LOOP;
END $$;

COMMIT;

-- Verify counts (should all be 0)
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM public.users
UNION ALL SELECT 'provider_profiles', COUNT(*) FROM public.provider_profiles
UNION ALL SELECT 'service_packages', COUNT(*) FROM public.service_packages
UNION ALL SELECT 'portfolio_items', COUNT(*) FROM public.portfolio_items
UNION ALL SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications;
