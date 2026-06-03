-- ============================================
-- CHECK EXISTING PORTFOLIOS
-- ============================================
-- Run this in Supabase SQL Editor to see existing data
-- URL: https://app.supabase.com/project/tvxoeybxlzwnpszdqiup/sql

-- 1. Check if portfolio_items table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'portfolio_items';

-- 2. Count portfolio items
SELECT COUNT(*) as total_portfolio_items
FROM portfolio_items;

-- 3. View all portfolio items
SELECT 
  id,
  provider_id,
  title,
  description,
  category,
  is_featured,
  display_order,
  created_at,
  SUBSTRING(image_url, 1, 50) || '...' as image_url_preview
FROM portfolio_items
ORDER BY created_at DESC;

-- 4. View portfolio items with provider info
SELECT 
  pi.id,
  pi.title,
  pi.category,
  pi.is_featured,
  pp.business_name as provider_business,
  pp.service_type as provider_services,
  u.name as provider_name,
  u.email as provider_email,
  pi.created_at
FROM portfolio_items pi
LEFT JOIN provider_profiles pp ON pi.provider_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
ORDER BY pi.created_at DESC;

-- 5. Count items per provider
SELECT 
  pp.business_name,
  u.name as provider_name,
  COUNT(pi.id) as total_items,
  COUNT(CASE WHEN pi.is_featured THEN 1 END) as featured_items
FROM provider_profiles pp
LEFT JOIN portfolio_items pi ON pp.id = pi.provider_id
LEFT JOIN users u ON pp.user_id = u.id
GROUP BY pp.id, pp.business_name, u.name
HAVING COUNT(pi.id) > 0
ORDER BY total_items DESC;

-- 6. Check provider profiles
SELECT 
  id,
  user_id,
  business_name,
  service_type,
  specializations,
  is_verified,
  total_bookings,
  average_rating,
  availability_status
FROM provider_profiles
ORDER BY created_at DESC;

-- 7. Check storage bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'portfolio-images';

-- 8. Check uploaded images in storage
SELECT 
  name,
  bucket_id,
  ROUND(metadata->>'size'::numeric / 1024, 2) as size_kb,
  created_at
FROM storage.objects
WHERE bucket_id = 'portfolio-images'
ORDER BY created_at DESC
LIMIT 20;
