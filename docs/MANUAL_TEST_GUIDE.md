# ShutterLink — Fresh database & manual test guide

Use this after clearing Supabase so you can test **register → login → provider → customer → booking → payment** from scratch.

---

## Part 1 — One-time setup (migrations)

In **Supabase → SQL Editor**, run these files **once** (in order) if you have not already:

1. `backend/supabase/migrations/018_ensure_messages_and_notifications.sql`
2. `backend/supabase/migrations/019_ensure_payments_columns.sql`

Check schema:

- Open `http://localhost:5000/api/health/schema`
- Expect: `bookings`, `payments`, `messages`, `notifications` → `true`

Ensure `backend/.env` has:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for API writes)

Restart API: `cd backend` → `npm run dev`  
Restart UI: `cd frontend` → `npm run dev`

---

## Part 2 — Clear all data

### Option A — Script (recommended: clears DB + login accounts)

```bash
cd backend
npx ts-node scripts/reset-test-data.ts
```

### Option B — SQL only (public tables; auth users stay)

1. Supabase → **SQL Editor** → run `backend/supabase/CLEAR_ALL_DATA.sql`
2. Supabase → **Authentication → Users** → delete all users manually

Also clear browser: DevTools → Application → Local Storage → remove `shutterlink_token` (or use incognito).

---

## Part 3 — Manual test flow

### 1. Create accounts (register)

| Step | URL | Action |
|------|-----|--------|
| Customer | http://localhost:3000/register | Name, email, password, role **Customer** |
| Provider | http://localhost:3000/register | New email, role **Service Provider** |
| Admin | Do **not** self-register | Create in Supabase `users` with `role = admin` if needed, or use existing admin |

Password rules: 8+ chars, uppercase, number, special character.

After register you should land on the correct dashboard.

### 2. Login test

- Log out → http://localhost:3000/login
- Log in as **customer** → `/dashboard`
- Log out → log in as **provider** → `/provider`

### 3. Provider setup

| Step | Where | What to do |
|------|--------|------------|
| Profile | Provider → Profile | Business name, bio, coverage areas, save |
| Package | Provider → Packages | Create package (name, price, active) |
| Portfolio | Provider → Portfolio | Upload 1+ images |

### 4. Customer — marketplace

| Step | Where | What to do |
|------|--------|------------|
| Explore packages | /explore | See your package |
| Explore portfolios | /explore?tab=portfolios | See portfolio album |
| Album detail | Click album | Photos + packages |
| Book | Click package → Book | Date, time, location → submit |

### 5. Customer — dashboard

| Page | Path | Check |
|------|------|--------|
| Dashboard | /dashboard | Stats, active bookings |
| My Bookings | /dashboard/bookings | New booking **pending** |
| Payments | /dashboard/payments | **Pay Now** on pending booking |
| Messages | /dashboard/messages | Start chat with provider |
| Notifications | /dashboard/notifications | Booking/payment alerts |
| History | /dashboard/history | After completed/cancelled |
| Reviews | /dashboard/reviews | After provider marks booking **completed** |

### 6. Payment (simulate if no gateway keys)

1. Payments → **Pay Now** → choose method → pay  
2. Without OnePay/PayHere keys, backend uses **simulate** mode and confirms booking  
3. Booking status should become **confirmed**

### 7. Provider — booking

| Step | Where | What to do |
|------|--------|------------|
| Bookings | Provider → Bookings | See customer booking |
| Complete | Mark booking **completed** | Enables customer review |

### 8. Customer — review

- /dashboard/reviews → write review for completed booking

### 9. Admin (optional)

- /admin — verify providers, view users/bookings/payments

---

## Part 4 — Quick checklist

- [ ] Register customer + provider
- [ ] Login both roles
- [ ] Provider: profile, package, portfolio
- [ ] Explore shows package + portfolio
- [ ] Customer creates booking
- [ ] Customer pays (pending → confirmed)
- [ ] Messages send/receive
- [ ] Notifications appear
- [ ] Provider completes booking
- [ ] Customer leaves review

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| RLS / failed to create booking | Set `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`, restart API |
| Failed to fetch conversations | Run migration `018_ensure_messages_and_notifications.sql` |
| Failed to fetch payments | Run migration `019_ensure_payments_columns.sql` |
| Old users still login after SQL clear | Run `reset-test-data.ts` or delete users in Supabase Auth UI |
| Explore empty | Provider package must be **active**; restart backend after code changes |

---

## Test accounts template (fill after register)

| Role | Email | Password (note locally) |
|------|-------|-------------------------|
| Customer | | |
| Provider | | |
| Admin | | |

Do not commit real passwords to git.
