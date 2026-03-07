# 🎨 PROVIDER PROFILE & PORTFOLIO SETUP GUIDE

Complete integration of Provider Profiles and Portfolio Items with your existing Supabase database.

---

## 📋 Table of Contents

1. [Quick Setup (2 Steps)](#quick-setup)
2. [What Was Created](#what-was-created)
3. [Database Setup](#database-setup)
4. [Testing the Features](#testing-the-features)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Setup

### Step 1: Run SQL Migrations

Go to your Supabase SQL Editor:  
**https://app.supabase.com/project/tvxoeybxlzwnpszdqiup/sql**

Run these 3 SQL files in order:

1. **Provider Profiles RLS** (Add RLS policies to your existing table):
   ```sql
   -- Copy content from: supabase/migrations/003_provider_profiles_rls.sql
   ```

2. **Portfolio Items Table** (Create new table for portfolio):
   ```sql
   -- Copy content from: supabase/migrations/002_portfolio_items_table.sql
   ```

### Step 2: Test the Features

1. **Login as a Provider** (user with role = 'provider')
2. **Navigate to Profile** tab in the provider dashboard
3. **Fill out your profile** (Business name, service types, etc.)
4. **Navigate to Portfolio** tab
5. **Add portfolio items** with images

---

## 📦 What Was Created

### 1. Database Migrations

#### `003_provider_profiles_rls.sql`
- ✅ RLS policies for your existing `provider_profiles` table
- ✅ Helper functions (`has_provider_profile`, `get_provider_profile_id`)
- ✅ Policies: View (public), Create/Update/Delete (own profile only)

#### `002_portfolio_items_table.sql`
- ✅ Creates `portfolio_items` table
- ✅ Foreign key to `provider_profiles(id)`
- ✅ RLS policies for public viewing, provider CRUD
- ✅ Storage bucket `portfolio-images` for image uploads
- ✅ Storage policies for image management
- ✅ Indexes for performance
- ✅ Auto-updated `updated_at` trigger

### 2. Frontend Pages

#### Provider Profile Page
**Location**: `app/(provider)/provider/profile/page.tsx`

Features:
- ✅ Complete profile management UI
- ✅ Business information (name, service types, specializations)
- ✅ Pricing & availability settings
- ✅ Location & coverage areas
- ✅ Equipment list
- ✅ Social media links (Instagram, Facebook, Twitter, LinkedIn)
- ✅ Profile stats (bookings, rating, verification status)
- ✅ Real-time save to database

#### Portfolio Management Page
**Location**: `app/(provider)/provider/portfolio/page.tsx` (UPDATED)

Features:
- ✅ View all portfolio items in grid layout
- ✅ Add new items with image upload
- ✅ Edit existing items
- ✅ Delete items with confirmation
- ✅ Mark items as "Featured"
- ✅ Category organization
- ✅ Image upload to Supabase Storage
- ✅ Empty state for new users
- ✅ Loading states and error handling

### 3. Service Layer

All services already exist and are working:
- ✅ `services/provider.ts` - Provider profile CRUD
- ✅ `services/portfolio.ts` - Portfolio items CRUD
- ✅ `services/provider-helper.ts` - Helper to get provider_profile_id from user_id

### 4. Navigation

Updated provider sidebar to include:
- ✅ Profile link (new)
- ✅ Portfolio link (existing)

---

## 🗄️ Database Setup

### Schema Overview

#### `provider_profiles` (Your Existing Table)
```sql
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  business_name VARCHAR(255),
  service_type VARCHAR(20)[],
  specializations VARCHAR(100)[],
  years_experience INTEGER,
  hourly_rate NUMERIC(10, 2),
  availability_status VARCHAR(20),
  bio TEXT,
  equipment_list TEXT,
  coverage_areas VARCHAR(100)[],
  max_travel_distance INTEGER,
  portfolio_url VARCHAR(500),
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN,
  total_bookings INTEGER,
  average_rating NUMERIC(3, 2),
  response_time_hours INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `portfolio_items` (New Table)
```sql
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(50),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Bucket

**Bucket Name**: `portfolio-images`
- ✅ Public read access (anyone can view)
- ✅ Authenticated write access (providers can upload)
- ✅ Owner-only update/delete
- ✅ Max file size: 5MB
- ✅ Supported formats: JPG, PNG, WebP

---

## 🧪 Testing the Features

### 1. Test Provider Profile

1. **Login as Provider**:
   - User must have `role = 'provider'` in the `users` table

2. **Navigate to Profile**:
   - Go to `/provider/profile`

3. **Fill Out Profile**:
   - Business Name: "John's Photography"
   - Service Types: Select "Photographer"
   - Specializations: Select "Wedding", "Portrait"
   - Years Experience: 5
   - Hourly Rate: 5000
   - Bio: Enter a description
   - Coverage Areas: "Colombo, Kandy, Galle"
   - Social Media: Add your links

4. **Click "Save Profile"**:
   - Should see success toast
   - Profile stats should update

5. **Verify in Database**:
   ```sql
   SELECT * FROM provider_profiles WHERE user_id = 'YOUR_USER_ID';
   ```

### 2. Test Portfolio Items

1. **Navigate to Portfolio**:
   - Go to `/provider/portfolio`

2. **Add Portfolio Item**:
   - Click "Add Item"
   - Title: "Beach Wedding Ceremony"
   - Description: "Beautiful sunset wedding"
   - Category: "Wedding"
   - Upload an image (max 5MB)
   - Toggle "Featured" if desired
   - Click "Add to Portfolio"

3. **Verify Upload**:
   - Item should appear in grid
   - Image should be displayed
   - Featured badge should show (if enabled)

4. **Edit Item**:
   - Click edit icon on card
   - Change title or description
   - Click "Save Changes"

5. **Delete Item**:
   - Click delete icon
   - Confirm deletion
   - Item should be removed

6. **Verify in Database**:
   ```sql
   SELECT * FROM portfolio_items WHERE provider_id = 'YOUR_PROVIDER_PROFILE_ID';
   ```

7. **Check Storage**:
   - Go to Supabase Storage
   - Check `portfolio-images` bucket
   - Images should be stored as `{provider_id}-{timestamp}.{ext}`

### 3. Test RLS Policies

#### Provider Profiles

**Test 1: Public can view profiles**
```sql
-- Logout from Supabase SQL editor (run as anon)
SELECT * FROM provider_profiles;
-- Should return all profiles
```

**Test 2: Provider can update own profile**
```sql
-- As authenticated provider
UPDATE provider_profiles 
SET business_name = 'Test Update'
WHERE user_id = auth.uid();
-- Should succeed
```

**Test 3: Provider cannot update other profiles**
```sql
-- As authenticated provider
UPDATE provider_profiles 
SET business_name = 'Hack Attempt'
WHERE user_id != auth.uid();
-- Should fail (0 rows updated)
```

#### Portfolio Items

**Test 1: Public can view portfolio**
```sql
-- As anon
SELECT * FROM portfolio_items;
-- Should return all items
```

**Test 2: Provider can add own items**
```sql
-- As authenticated provider
INSERT INTO portfolio_items (provider_id, title, image_url)
VALUES (
  (SELECT id FROM provider_profiles WHERE user_id = auth.uid()),
  'Test Item',
  'https://example.com/image.jpg'
);
-- Should succeed
```

**Test 3: Provider cannot add items for others**
```sql
-- As authenticated provider
INSERT INTO portfolio_items (provider_id, title, image_url)
VALUES (
  'different-provider-id',
  'Test Item',
  'https://example.com/image.jpg'
);
-- Should fail (policy violation)
```

---

## 🔍 Troubleshooting

### Issue 1: "Provider profile not found"

**Cause**: User doesn't have a provider_profile entry

**Solution**:
1. Make sure user has `role = 'provider'` in `users` table
2. Go to `/provider/profile` and fill out the form
3. Click "Save Profile" to create the profile

**Verify**:
```sql
SELECT * FROM users WHERE id = 'YOUR_USER_ID';
SELECT * FROM provider_profiles WHERE user_id = 'YOUR_USER_ID';
```

### Issue 2: "Failed to upload image"

**Possible Causes**:
1. Storage bucket doesn't exist
2. Storage policies not set
3. File too large (>5MB)
4. Invalid file type

**Solutions**:

**Check if bucket exists**:
```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-images';
```

**Create bucket if missing**:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true);
```

**Check storage policies**:
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'portfolio-images';
```

**Re-run storage policies** from `002_portfolio_items_table.sql`

### Issue 3: "Permission denied" when saving profile

**Cause**: RLS policies not applied

**Solution**:
1. Run `003_provider_profiles_rls.sql` in Supabase SQL Editor
2. Verify policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'provider_profiles';
```

### Issue 4: Portfolio items not showing

**Possible Causes**:
1. Foreign key mismatch (provider_id)
2. RLS blocking query
3. No items created yet

**Debug**:
```sql
-- Check if table exists
SELECT * FROM portfolio_items LIMIT 1;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'portfolio_items';

-- Check if items exist for your provider
SELECT pi.* 
FROM portfolio_items pi
JOIN provider_profiles pp ON pi.provider_id = pp.id
WHERE pp.user_id = 'YOUR_USER_ID';
```

### Issue 5: Image upload succeeds but image doesn't display

**Cause**: Public access not enabled on bucket

**Solution**:
```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'portfolio-images';
```

### Issue 6: Cannot delete portfolio items

**Cause**: Missing delete policy

**Solution**:
Re-run the RLS policies section from `002_portfolio_items_table.sql`:
```sql
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
```

---

## 📊 Database Verification Commands

### Check All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('provider_profiles', 'portfolio_items');
```

### Check Foreign Keys
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('portfolio_items');
```

### Check RLS Policies
```sql
-- Provider profiles policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'provider_profiles';

-- Portfolio items policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'portfolio_items';
```

### Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-images';
SELECT * FROM storage.policies WHERE bucket_id = 'portfolio-images';
```

### Check Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('provider_profiles', 'portfolio_items');
```

---

## 🎯 Summary

### ✅ What's Working:

1. **Provider Profiles**:
   - Complete CRUD operations
   - RLS policies for security
   - Full UI for management
   - Social media integration
   - Stats display

2. **Portfolio Items**:
   - Complete CRUD operations
   - Image upload to Supabase Storage
   - RLS policies for security
   - Featured items support
   - Category organization
   - Full UI with dialogs

3. **Integration**:
   - Proper foreign key relationship (provider_profiles → portfolio_items)
   - Helper functions to bridge user_id → provider_profile_id
   - Navigation updated
   - All services connected

### 🔗 Database Relationships:

```
users (id)
  ↓
provider_profiles (user_id → users.id)
  ↓
portfolio_items (provider_id → provider_profiles.id)
```

### 📁 Files Created/Updated:

**Database**:
- `supabase/migrations/002_portfolio_items_table.sql` (NEW)
- `supabase/migrations/003_provider_profiles_rls.sql` (NEW)

**Frontend**:
- `app/(provider)/provider/profile/page.tsx` (NEW)
- `app/(provider)/provider/portfolio/page.tsx` (UPDATED)
- `app/(provider)/layout.tsx` (UPDATED - added Profile link)

**Backend** (already exists):
- `services/provider.ts`
- `services/portfolio.ts`
- `services/provider-helper.ts`

---

## 🚀 Next Steps

After setup is complete:

1. **Test all features** using the testing guide above
2. **Customize categories** in portfolio page if needed
3. **Add more fields** to provider profile if required
4. **Set up automated backup** for portfolio images
5. **Monitor storage usage** in Supabase dashboard
6. **Consider CDN** for image optimization (if high traffic)

---

## 💬 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Run the verification commands
3. Check browser console for errors
4. Check Supabase logs for database errors
5. Verify RLS policies are applied correctly

---

**🎉 You're all set! Happy coding!**
