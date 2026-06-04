-- Add provider_id / customer_id when reviews was created with reviewer_id only

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(255);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

UPDATE public.reviews r
SET
  customer_id = COALESCE(r.customer_id, r.reviewer_id),
  provider_id = COALESCE(r.provider_id, b.provider_id)
FROM public.bookings b
WHERE r.booking_id = b.id
  AND (r.provider_id IS NULL OR r.customer_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique ON public.reviews(booking_id);

NOTIFY pgrst, 'reload schema';
