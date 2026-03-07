# 📸 VIEW EXISTING PORTFOLIOS

Three ways to view portfolio items from your database:

---

## Method 1: View in Browser (Easiest) ⭐

1. **Open your app** in a browser:
   ```
   http://localhost:3000/portfolios
   ```

2. **See the portfolio viewer page**:
   - Shows all portfolio items in a grid
   - Stats: Total items, featured items, providers, categories
   - Breakdown by category and provider
   - No login required!

---

## Method 2: Browser Console Script

1. **Open your app** in a browser:
   ```
   http://localhost:3000
   ```

2. **Open Developer Console**:
   - Press `F12` or `Ctrl+Shift+J` (Windows)
   - Press `Cmd+Option+J` (Mac)

3. **Copy and paste** the entire content from:
   ```
   view-portfolios-browser.js
   ```

4. **Press Enter** to run the script

5. **View the output** in console:
   - Lists all portfolio items
   - Shows provider information
   - Category breakdown
   - Featured items count

---

## Method 3: SQL Query (Most Detailed)

1. **Go to Supabase SQL Editor**:
   ```
   https://app.supabase.com/project/tvxoeybxlzwnpszdqiup/sql
   ```

2. **Copy queries** from `supabase/CHECK_PORTFOLIOS.sql`

3. **Run each query** to see:
   - All portfolio items
   - Items with provider details
   - Count by provider
   - Provider profiles
   - Storage bucket info
   - Uploaded images

---

## Quick SQL Queries

### See all portfolio items:
```sql
SELECT 
  id,
  title,
  category,
  is_featured,
  created_at
FROM portfolio_items
ORDER BY created_at DESC;
```

### Count items:
```sql
SELECT COUNT(*) as total FROM portfolio_items;
```

### Items with provider names:
```sql
SELECT 
  pi.title,
  pi.category,
  pp.business_name as provider,
  u.name as user_name
FROM portfolio_items pi
LEFT JOIN provider_profiles pp ON pi.provider_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id;
```

### Featured items only:
```sql
SELECT title, category 
FROM portfolio_items 
WHERE is_featured = true;
```

### Count by category:
```sql
SELECT 
  category,
  COUNT(*) as count
FROM portfolio_items
GROUP BY category
ORDER BY count DESC;
```

---

## Current State

If you just set up the system, you might see:

### ✅ Tables Exist But Empty
```
📭 No portfolio items found

💡 To add items:
   1. Login as a provider
   2. Go to /provider/profile (create profile first)
   3. Go to /provider/portfolio
   4. Click "Add Item"
```

### ❌ Tables Don't Exist
```
❌ Error: relation "portfolio_items" does not exist

💡 Run migrations:
   - supabase/migrations/002_portfolio_items_table.sql
   - supabase/migrations/003_provider_profiles_rls.sql
```

---

## Files Created

1. **`app/(public)/portfolios/page.tsx`** - NEW
   - Public portfolio viewer page
   - Visit: http://localhost:3000/portfolios

2. **`view-portfolios-browser.js`**
   - Browser console script
   - Run in dev tools

3. **`supabase/CHECK_PORTFOLIOS.sql`**
   - SQL queries for Supabase SQL Editor
   - Comprehensive data inspection

4. **`view-portfolios.js`** (optional)
   - Node.js script (requires dependencies)

---

## Next Steps

### If No Portfolios Found:

1. **Create provider profile**:
   - Login as provider
   - Go to `/provider/profile`
   - Fill out and save

2. **Add portfolio items**:
   - Go to `/provider/portfolio`
   - Click "Add Item"
   - Upload image
   - Fill details
   - Save

3. **View results**:
   - Go to `/portfolios` to see public view
   - Or run console script again

### If Tables Don't Exist:

1. **Run migrations** in Supabase SQL Editor:
   - `003_provider_profiles_rls.sql`
   - `002_portfolio_items_table.sql`

2. **Verify**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('provider_profiles', 'portfolio_items');
   ```

---

## Troubleshooting

### "Permission denied"
→ RLS policies not applied. Re-run migrations.

### "Table does not exist"
→ Run `002_portfolio_items_table.sql`

### "Provider profile not found"
→ Create profile at `/provider/profile` first

### Images not loading
→ Check storage bucket:
```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-images';
```

---

**🎯 Recommended: Visit `/portfolios` for the easiest way to view all items!**
