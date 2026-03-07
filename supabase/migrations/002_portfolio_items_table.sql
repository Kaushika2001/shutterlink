-- ============================================
-- PORTFOLIO ITEMS TABLE & RLS POLICIES
-- ============================================
-- This migration creates the portfolio_items table
-- Used by: services/portfolio.ts, app/(provider)/provider/portfolio/page.tsx

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  provider_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(50),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_items_provider_id_fkey FOREIGN KEY (provider_id) 
    REFERENCES public.provider_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_items_provider_id 
  ON public.portfolio_items USING btree (provider_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured 
  ON public.portfolio_items USING btree (is_featured) 
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_category 
  ON public.portfolio_items USING btree (category);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_display_order 
  ON public.portfolio_items USING btree (provider_id, display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_portfolio_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view portfolio items (public browsing)
CREATE POLICY "Anyone can view portfolio items"
  ON public.portfolio_items
  FOR SELECT
  USING (true);

-- Policy 2: Providers can insert their own portfolio items
CREATE POLICY "Providers can insert own portfolio items"
  ON public.portfolio_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.id = portfolio_items.provider_id
      AND pp.user_id = auth.uid()
    )
  );

-- Policy 3: Providers can update their own portfolio items
CREATE POLICY "Providers can update own portfolio items"
  ON public.portfolio_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.id = portfolio_items.provider_id
      AND pp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.id = portfolio_items.provider_id
      AND pp.user_id = auth.uid()
    )
  );

-- Policy 4: Providers can delete their own portfolio items
CREATE POLICY "Providers can delete own portfolio items"
  ON public.portfolio_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.id = portfolio_items.provider_id
      AND pp.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET FOR PORTFOLIO IMAGES
-- ============================================

-- Create storage bucket for portfolio images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Authenticated users can upload portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own portfolio images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own portfolio images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
