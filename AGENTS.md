# ShutterLink Agent Instructions

**Project**: Photography marketplace connecting photographers/editors with customers. Built with Next.js 15, TypeScript, Supabase, and Tailwind CSS.

## Quick Developer Commands

```bash
npm install           # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run ESLint
```

## Architecture & Routes

### Route Structure (Next.js App Router)
- **(public)** - Unauthenticated pages: `/, /browse, /explore, /portfolios, /provider-profile/[id]`
- **(auth)** - `login, register, forgot-password` (no layout wrapper)
- **(customer)** - Authenticated customer routes: `/dashboard/*` (bookings, payments, reviews, history)
- **(provider)** - Authenticated provider routes: `/provider/*` (profile, portfolio, packages, bookings, calendar, earnings, reviews)
- **(admin)** - Authenticated admin routes: `/admin/*` (users, providers, bookings, payments, reports)

### Code Organization
- `app/` - Next.js App Router pages and layouts (route groups: `(public)`, `(auth)`, `(customer)`, `(provider)`, `(admin)`)
- `services/` - Supabase API service layer (auth, provider, portfolio, packages, bookings, payments, reviews, notifications, messaging, availability)
- `components/` - Reusable UI components via shadcn/ui (ui/, cards/, layout/, charts/)
- `context/` - React contexts (auth-context, theme-provider)
- `lib/` - Utilities (supabaseClient.ts, utils.ts, adapters.ts)
- `types/` - TypeScript definitions (database.ts with Supabase schema types)
- `data/` - Mock data for development
- `supabase/` - Migrations (in `migrations/` subdirectory, numbered 001-009) and RLS policies

### Key Entrypoints
- **Auth flow**: `context/auth-context.tsx` - manages user session, login, register, logout with Supabase Auth
- **Supabase client**: `lib/supabaseClient.ts` - shared client instance for all queries
- **Services**: `services/` directory - all database operations go here (follow existing pattern)

## Database & Migrations

**Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<your_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

### Migrations
Apply in **exact numerical order** via Supabase SQL Editor (`supabase/migrations/`):
1. `001_create_service_packages.sql`
2. `002_portfolio_items_table.sql`
3. `003_provider_profiles_rls.sql`
4. `004_create_bookings_table.sql`
5. `005_create_payments_table.sql`
6. `006_create_reviews_table.sql`
7. `007_create_availability_tables.sql`
8. `008_create_notifications_table.sql`
9. `009_create_messages_table.sql`

After migrations: Create `portfolio-images` bucket in Storage (PUBLIC, not private).

### Database Schema
Full schema documented in `database-schema.md`. Key tables:
- `users` - Core auth table (id, email, name, role, contact_number, timestamps)
- `user_profiles` - Extended profile (bio, picture_url, location, language_preference, notifications, etc.)
- `provider_profiles` - Photographer/editor info (business_name, specializations, hourly_rate, etc.)
- `portfolios` - Provider portfolios (title, description, is_public)
- `portfolio_images` - Images in portfolios (image_url, display_order)
- `service_packages` - Custom service offerings (name, description, price, duration)
- `bookings` - Booking records (status: pending/confirmed/completed/cancelled)
- `payments` - Payment tracking (amount, status, method)
- `reviews` - Customer reviews (rating, comment, provider_id, customer_id)
- `availability` - Provider availability slots (date, start_time, end_time, is_available)
- `notifications` - User notifications (type, title, message, read_at)
- `messages` - Provider-customer messaging (sender_id, receiver_id, message, read_at)

## Authentication & Authorization

**Pattern**: Public browse, authenticated actions. `AuthModal` popup triggers for protected features.

### Roles
- **customer** - Browse, book, review
- **provider** - Create profile, upload portfolio, manage packages and bookings
- **admin** - User management, provider verification, analytics

### Context API
- `useAuth()` hook in components for `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, `resetPassword()`
- User data synced with Supabase session on mount and auth state changes
- Dev-only `switchRole` for testing (see `RoleSwitcher` component)

## TypeScript & Type System

- `types/database.ts` - Auto-generate or manually maintain Supabase table types
- Strict TypeScript enabled in `tsconfig.json`; no `any` types without justification
- `UserRole` enum: 'customer' | 'provider' | 'admin'

## Styling & Components

- **CSS Framework**: Tailwind CSS 4.2 (with PostCSS)
- **Component Library**: Radix UI (primitives) + shadcn/ui (higher-level components in `components.json`)
- **Icons**: lucide-react
- **Theme**: Light/dark support via `next-themes` (see `theme-provider.tsx`)
- **Forms**: react-hook-form + zod for validation (see existing pages)
- **Notifications**: sonner (toast notifications, see components/ui/sonner)
- **Date Handling**: date-fns

## Common Patterns

### Service Layer (all operations in `services/`)
```typescript
// services/provider.ts pattern
export const getProviders = async () => {
  const { data, error } = await supabase.from('provider_profiles').select('*')
  if (error) throw error
  return data
}
```

### Client Components
- Use `"use client"` directive for interactivity
- Always use context for auth state via `const { user, isAuthenticated } = useAuth()`
- Import components from `@/components` (baseUrl alias `@/*` in tsconfig.json)

### Error Handling
- Service functions throw errors; components catch and show toast via sonner
- Auth errors have user-friendly messages (see `services/auth.ts` for patterns)

## Testing & Setup

### No Automated Tests
The project currently has **no test suite**. Testing is manual:
- Open browser to `http://localhost:3000`
- Use dev-mode `RoleSwitcher` component to switch roles for testing
- Create test accounts in Supabase directly for persistent testing

### Setup New Instance
1. Create Supabase project, get URL and anon key
2. Add credentials to `.env.local`
3. Apply all migrations in exact numerical order via Supabase SQL Editor (migrations listed above)
4. Create `portfolio-images` PUBLIC bucket in Supabase Storage
5. Run `npm install && npm run dev`

### Test Accounts
- Create customer account (role: 'customer')
- Create provider account (role: 'provider')
- Test flow: browse → click "Book Now" → AuthModal appears → login → proceed

## Known Quirks & Gotchas

1. **Migration Order Matters** - Apply migrations in numerical order; schema depends on it
2. **RLS Policies** - Each table needs explicit RLS policies; check existing policies before modifying schema
3. **Portfolio Images** - Bucket must be PUBLIC, not private; test uploads fail silently if not set
4. **Email Verification** - Supabase Auth handles verification; confirm in dashboard before relying on `is_verified`
5. **Next.js 15 Changes** - Using React 19 (latest); avoid deprecated patterns
6. **SSR vs Client** - Pages with `useAuth()` must be client components; use `"use client"` directive
7. **Eslint Strict** - Extends Next.js core-web-vitals and TypeScript rules; no unused variables or type errors in builds

## Documentation References

- `README.md` - Project overview and setup
- `database-schema.md` - Full database schema with RLS notes
- `PROVIDER_PORTFOLIO_SETUP.md` - Provider onboarding flow
- `QUICK_START_PROVIDER.md` - Quick provider setup guide
- `VIEW_PORTFOLIOS.md` - Portfolio viewing mechanics
- `PUBLIC_BROWSE_AUTH.md` - Authentication implementation guide

## File Reference Convention

When referencing code in guidance, use format: `file:line_number` (e.g., `services/auth.ts:30` for user insertion during registration).
