-- Run this in Supabase Dashboard → SQL Editor → Run
-- Creates availability_schedules + blocked_dates (idempotent)

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_blocked_date UNIQUE (provider_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_availability_provider_id ON public.availability_schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON public.availability_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_provider_id ON public.blocked_dates(provider_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_blocked_date ON public.blocked_dates(blocked_date);

DROP TRIGGER IF EXISTS update_availability_schedules_updated_at ON public.availability_schedules;
CREATE TRIGGER update_availability_schedules_updated_at
  BEFORE UPDATE ON public.availability_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone see active availability" ON public.availability_schedules;
CREATE POLICY "Anyone see active availability" ON public.availability_schedules
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Providers see own availability" ON public.availability_schedules;
CREATE POLICY "Providers see own availability" ON public.availability_schedules
  FOR SELECT USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers manage own availability" ON public.availability_schedules;
CREATE POLICY "Providers manage own availability" ON public.availability_schedules
  FOR ALL USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Anyone see blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone see blocked dates" ON public.blocked_dates
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Providers manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Providers manage blocked dates" ON public.blocked_dates
  FOR ALL USING (auth.uid() = provider_id);

GRANT ALL ON public.availability_schedules TO service_role;
GRANT ALL ON public.blocked_dates TO service_role;
GRANT SELECT ON public.availability_schedules TO anon, authenticated;
GRANT SELECT ON public.blocked_dates TO anon, authenticated;
