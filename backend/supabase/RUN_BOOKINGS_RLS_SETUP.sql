-- Run in Supabase Dashboard → SQL Editor if bookings fail with RLS (code 42501)
-- Safe to re-run

DROP POLICY IF EXISTS "service_role_all_bookings" ON public.bookings;

CREATE POLICY "service_role_all_bookings"
  ON public.bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
