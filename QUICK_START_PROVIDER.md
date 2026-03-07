# ⚡ PROVIDER & PORTFOLIO - QUICK START

**2-Step Setup** → Test immediately!

---

## Step 1: Run SQL (2 minutes)

Open Supabase SQL Editor:  
https://app.supabase.com/project/tvxoeybxlzwnpszdqiup/sql

### Run File 1: Provider Profiles RLS
```sql
-- Paste content from: supabase/migrations/003_provider_profiles_rls.sql
-- Click RUN
```

### Run File 2: Portfolio Items Table
```sql
-- Paste content from: supabase/migrations/002_portfolio_items_table.sql
-- Click RUN
```

---

## Step 2: Test Features (5 minutes)

### Test Provider Profile:
1. Login as provider
2. Go to `/provider/profile`
3. Fill out form:
   - Business Name: "Test Studio"
   - Service Type: Check "Photographer"
   - Specializations: Select a few
   - Hourly Rate: 5000
   - Bio: Write something
4. Click "Save Profile"
5. ✅ Should see success message

### Test Portfolio:
1. Go to `/provider/portfolio`
2. Click "Add Item"
3. Fill form:
   - Title: "Test Project"
   - Description: "Test description"
   - Category: "Wedding"
   - Upload image (< 5MB)
4. Click "Add to Portfolio"
5. ✅ Should see item in grid
6. Click edit/delete icons to test

---

## ✅ Success Checklist

- [ ] Profile page loads without errors
- [ ] Can save profile data
- [ ] Profile stats show correct values
- [ ] Portfolio page loads without errors
- [ ] Can upload images
- [ ] Can see uploaded items
- [ ] Can edit items
- [ ] Can delete items
- [ ] Featured badge works

---

## 🔍 Quick Troubleshooting

### "Provider profile not found"
→ User needs `role = 'provider'` in `users` table

### "Failed to upload image"
→ Check storage bucket exists:
```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-images';
```

### "Permission denied"
→ Re-run both SQL files from Step 1

### Items not showing
→ Check if items exist:
```sql
SELECT * FROM portfolio_items LIMIT 5;
```

---

## 📁 What Was Created

### Pages:
- `/provider/profile` - NEW (Profile management)
- `/provider/portfolio` - UPDATED (Real database integration)

### Database:
- `portfolio_items` table - NEW
- RLS policies on `provider_profiles` - NEW
- RLS policies on `portfolio_items` - NEW
- Storage bucket `portfolio-images` - NEW

### Navigation:
- Added "Profile" link to provider sidebar

---

## 🎯 Key Features

**Provider Profile**:
- Business info
- Service types & specializations
- Pricing & availability
- Location & coverage
- Equipment list
- Social media links
- Profile stats

**Portfolio**:
- Upload images (max 5MB)
- Add title, description, category
- Mark as featured
- Edit/delete items
- Public viewing
- Grid layout

---

## 📖 Full Documentation

For detailed info, see: `PROVIDER_PORTFOLIO_SETUP.md`

---

**Ready to go! 🚀**
