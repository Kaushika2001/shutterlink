-- Ensure the Supabase service_role can manage bookings (Express API uses service role key).
-- The service role normally bypasses RLS; this policy is a safety net for some Postgres configs.

DROP POLICY IF EXISTS "service_role_all_bookings" ON public.bookings;

CREATE POLICY "service_role_all_bookings"
  ON public.bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
