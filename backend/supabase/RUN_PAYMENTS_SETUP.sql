-- Run in Supabase Dashboard → SQL Editor (safe to re-run)
-- Upgrades legacy payments (booking_id, amount, status, method) to full API schema

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_amount DECIMAL(10,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'deposit';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_gateway_id VARCHAR(255);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill from legacy column names
UPDATE public.payments SET payment_method = method WHERE payment_method IS NULL AND method IS NOT NULL;
UPDATE public.payments SET paid_at = payment_date WHERE paid_at IS NULL AND payment_date IS NOT NULL;

-- Link customer/provider from bookings where possible
UPDATE public.payments p
SET customer_id = b.customer_id, provider_id = b.provider_id
FROM public.bookings b
WHERE p.booking_id = b.id
  AND (p.customer_id IS NULL OR p.provider_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_payments" ON public.payments;
CREATE POLICY "service_role_all_payments" ON public.payments
    FOR ALL TO service_role USING (true) WITH CHECK (true);
