# ShutterLink - Photography Marketplace

A modern photography marketplace platform connecting customers with professional photographers and photo editors.

## 🚀 Features

### For Customers
- **Browse Without Login** - Explore photographers and their portfolios freely
- **Easy Booking** - Book photography sessions with transparent pricing
- **Secure Payments** - Safe and reliable payment processing
- **Reviews & Ratings** - Share your experience and read others' feedback
- **Dashboard** - Manage your bookings, payments, and reviews

### For Providers (Photographers/Editors)
- **Professional Profiles** - Showcase your business and services
- **Portfolio Management** - Upload and organize your work
- **Service Packages** - Create custom packages with pricing
- **Booking Management** - Track and manage customer bookings
- **Availability Control** - Set your schedule and availability
- **Analytics** - View your performance and earnings
- **Social Media Integration** - Connect your Instagram, Facebook, Twitter, LinkedIn

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for portfolio images)

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- npm or yarn package manager

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shutterlink
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables

**Local development**

- `backend/.env` — copy from `backend/.env.example` (Supabase, JWT, CORS)
- `frontend/.env.local` — copy from `frontend/.env.example`

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Production deploy:** see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full variable list and smoke tests.

### 4. Database Setup
Apply the migrations in order via Supabase Dashboard SQL Editor:

1. `migrations/001_current_schema.sql` - Basic users table
2. `migrations/002_phase1_complete.sql` - User profiles, provider profiles, portfolios
3. `migrations/003_fix_service_packages_rls.sql` - RLS fixes
4. `migrations/004_bookings_system.sql` - Bookings functionality
5. `migrations/005_payments_system.sql` - Payments tracking
6. `migrations/006_reviews_system.sql` - Reviews and ratings
7. **Create `portfolio-images` bucket** in Supabase Storage (PUBLIC)
8. `migrations/007_storage_buckets_setup.sql` - Storage policies
9. `migrations/008_add_social_media_fields.sql` - Social media URLs

See `migrations/README.md` for detailed instructions.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
shutterlink/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Public homepage
│   ├── browse/              # Browse photographers
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── customer/            # Customer dashboard & features
│   │   └── dashboard/
│   ├── provider/            # Provider dashboard & features
│   │   ├── dashboard/
│   │   ├── setup/          # Provider profile setup
│   │   ├── portfolio/      # Portfolio management
│   │   └── packages/       # Service packages
│   └── admin/              # Admin dashboard
├── src/
│   ├── components/          # Reusable React components
│   │   └── AuthModal.tsx   # Login/Register modal
│   ├── services/           # API service layer
│   │   ├── auth.ts         # Authentication
│   │   ├── provider.ts     # Provider operations
│   │   ├── portfolio.ts    # Portfolio management
│   │   ├── packages.ts     # Service packages
│   │   ├── bookings.ts     # Booking management
│   │   ├── payments.ts     # Payment tracking
│   │   └── reviews.ts      # Reviews & ratings
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.ts      # Authentication hooks
│   ├── types/              # TypeScript type definitions
│   │   └── database.ts     # Database types
│   ├── utils/              # Utility functions
│   │   └── currency.ts     # Currency formatting
│   └── lib/
│       └── supabaseClient.js # Supabase client
├── migrations/             # Database migrations
├── public/                 # Static assets
└── database-schema.md      # Database schema documentation
```

## 🔐 Authentication Flow

ShutterLink uses a **public browse** approach:
- Users can browse the homepage and view photographers **without logging in**
- Authentication is only required for protected actions:
  - Making bookings
  - Leaving reviews
  - Accessing dashboards
  - Managing profiles

When a user attempts a protected action, the `AuthModal` popup appears for login/registration.

See `PUBLIC_BROWSE_AUTH.md` for detailed implementation guide.

## 📚 Key Documentation

- **`database-schema.md`** - Complete database schema reference
- **`migrations/README.md`** - Database migration guide
- **`PUBLIC_BROWSE_AUTH.md`** - Authentication implementation guide

## 🎯 User Roles

### Customer
- Browse photographers
- Book photography sessions
- Leave reviews
- Manage bookings
- Track payments

### Provider
- Create professional profile
- Upload portfolio images
- Create service packages
- Manage bookings
- Respond to reviews
- View analytics

### Admin
- User management
- Provider verification
- Platform analytics
- Content moderation

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Run `npm run build`
- Start with `npm start`

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## 🧪 Testing

### Test User Accounts
After setting up, create test accounts:
- Customer account (role: 'customer')
- Provider account (role: 'provider')

### Test Flow
1. Browse homepage without login ✅
2. Click "Browse Photographers" ✅
3. Click "Book Now" on a photographer ✅
4. Login popup should appear ✅
5. After login, proceed to booking ✅

## 🐛 Troubleshooting

### "Could not find column" errors
- Make sure all migrations are applied in order
- Check Supabase table structure matches schema

### Portfolio images not uploading
- Verify `portfolio-images` bucket exists in Supabase Storage
- Ensure bucket is marked as PUBLIC
- Apply migration 007 for storage policies

### Auth not working
- Verify environment variables are set correctly
- Check Supabase Auth is enabled in dashboard

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review database schema
3. Verify migrations are applied

## 📄 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and structure.

---

**Built with ❤️ using Next.js and Supabase**
