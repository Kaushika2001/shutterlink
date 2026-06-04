-- Run in Supabase SQL Editor if payments fail with "Failed to fetch payments"
-- Aligns payments table with the Express API (safe to re-run)

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    platform_fee DECIMAL(10,2) DEFAULT 0,
    provider_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_type VARCHAR(50) DEFAULT 'deposit',
    payment_gateway_id VARCHAR(255),
    transaction_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Legacy column names used by some schemas
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.payments SET customer_id = payer_id WHERE customer_id IS NULL AND payer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own payments" ON public.payments;
CREATE POLICY "Users see their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id OR auth.uid() = payer_id);

DROP POLICY IF EXISTS "Customers can create payments" ON public.payments;
CREATE POLICY "Customers can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = customer_id OR auth.uid() = payer_id);

DROP POLICY IF EXISTS "service_role_all_payments" ON public.payments;
CREATE POLICY "service_role_all_payments" ON public.payments
    FOR ALL TO service_role USING (true) WITH CHECK (true);
