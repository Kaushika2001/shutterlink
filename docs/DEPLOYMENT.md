# ShutterLink deployment guide

All API traffic goes through environment variables. Nothing in the app should hardcode production URLs except localhost fallbacks for local dev.

## Vercel fullstack (recommended — frontend + serverless API)

**Step-by-step guide:** [DEPLOY_VERCEL_FULLSTACK.md](./DEPLOY_VERCEL_FULLSTACK.md)

One project: Next.js in `frontend/`, Express at `/api/*` via serverless function.

## Vercel + Render (separate API host)

**Step-by-step guide:** [DEPLOY_VERCEL_RENDER.md](./DEPLOY_VERCEL_RENDER.md)

| Platform | Root directory | Start / build |
|----------|----------------|---------------|
| **Render** (API) | `backend` | Build: `npm install && npm run build` · Start: `npm start` |
| **Vercel** (Next.js) | `frontend` | Auto · set `NEXT_PUBLIC_*` env vars before deploy |

Repo includes `render.yaml` (Render blueprint) and `frontend/vercel.json`.

## Architecture

| Service | Hosting examples | Env file |
|---------|------------------|----------|
| Frontend (Next.js) | Vercel, Netlify, Cloudflare Pages | `frontend/.env.local` or platform env |
| Backend (Express) | Railway, Render, Fly.io, VPS | `backend/.env` |
| Database / Auth | Supabase | keys in **backend** `.env` |

## 1. Supabase (one-time)

Run SQL setup in Supabase Dashboard → SQL Editor (in order as needed):

- Core migrations under `backend/supabase/migrations/`
- `RUN_AVAILABILITY_SETUP.sql`, `RUN_MESSAGING_SETUP.sql`, `RUN_REVIEWS_SETUP.sql` if tables are missing

Enable **Realtime** for `messages` if using inbox.

## 2. Backend deploy

### Required variables

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=<random 32+ chars>
CORS_ORIGIN=https://your-frontend.vercel.app
```

Use comma-separated origins if you have multiple frontends:

```env
CORS_ORIGIN=https://app.example.com,https://www.example.com
```

### Payments (production)

```env
PAYMENT_SANDBOX_MODE=false
PAYMENT_WEBHOOK_BASE_URL=https://api.example.com
PAYMENT_RETURN_URL=https://app.example.com/dashboard/payments/return
```

### Portfolio (Cloudinary)

```env
PORTFOLIO_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Build & start

```bash
cd backend
npm install
npm run build
npm run check:env   # with NODE_ENV=production in .env
npm start
```

### Verify backend

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Env checklist, Supabase service role, sandbox mode |
| `GET /api/health/schema` | DB tables present |
| `GET /api/config/public` | Supabase anon URL/key for browser Realtime |

## 3. Frontend deploy

Set these **before** `npm run build` on your host:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`NEXT_PUBLIC_API_URL` **must** include the `/api` suffix and must match where Express mounts routes.

### Verify frontend

1. Open browser DevTools → Network.
2. Any `fetch` to your API host should return JSON `{ success: true, ... }`.
3. Login/register → `POST /api/auth/login`, `GET /api/auth/me`.
4. Explore → `GET /api/public/...` (marketplace routes).

## 4. API route map (all under `NEXT_PUBLIC_API_URL`)

| Prefix | Features |
|--------|----------|
| `/auth` | Login, register, me |
| `/providers` | Profiles, search, packages |
| `/bookings` | Create, list, availability check |
| `/payments` | Checkout, webhooks, history |
| `/reviews` | Provider/customer reviews |
| `/availability` | Schedules, blocked dates |
| `/messages` | Inbox, booking chat |
| `/notifications` | User notifications |
| `/portfolio` | Upload, list |
| `/admin` | Admin dashboard |
| `/config/public` | Public Supabase + payment flags |
| `/public/providers/:id/details` | Provider profile page data |

## 5. Common deploy mistakes

| Symptom | Fix |
|---------|-----|
| CORS error in browser | Set `CORS_ORIGIN` to exact frontend URL (scheme + host, no trailing slash) |
| 401 on all actions | `JWT_SECRET` must be stable across restarts; user re-login after change |
| RLS / 42501 errors | Set `SUPABASE_SERVICE_ROLE_KEY` on backend |
| API calls go to localhost | Rebuild frontend after setting `NEXT_PUBLIC_API_URL` |
| Realtime not connecting | Set `NEXT_PUBLIC_SUPABASE_*` or ensure `/api/config/public` is reachable |
| Payments redirect wrong | Set `PAYMENT_RETURN_URL` and `PAYMENT_WEBHOOK_BASE_URL` to HTTPS production URLs |

## 6. Pre-deploy checklist

```bash
# Backend
cd backend && NODE_ENV=production npm run check:env

# Frontend
cd frontend && npm run build

# Smoke test (replace URLs)
curl https://api.example.com/api/health
curl https://api.example.com/api/config/public
```
