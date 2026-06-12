-- Balance payment after shoot completion (remaining 50% after deposit)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_paid BOOLEAN DEFAULT FALSE;

UPDATE public.bookings
SET balance_paid = true
WHERE deposit_paid = true
  AND total_price > 0
  AND deposit_amount >= total_price;
