-- One review per completed booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique ON public.reviews(booking_id);
