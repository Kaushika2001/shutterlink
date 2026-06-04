-- Run in Supabase Dashboard → SQL Editor → Run
-- Fixes: Could not find the 'provider_id' column of 'reviews' in the schema cache

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(255);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Backfill from bookings + reviewer_id
UPDATE public.reviews r
SET
  customer_id = COALESCE(r.customer_id, r.reviewer_id),
  provider_id = COALESCE(r.provider_id, b.provider_id)
FROM public.bookings b
WHERE r.booking_id = b.id
  AND (r.provider_id IS NULL OR r.customer_id IS NULL);

UPDATE public.reviews r
SET customer_id = r.reviewer_id
WHERE r.customer_id IS NULL AND r.reviewer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique ON public.reviews(booking_id);

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
