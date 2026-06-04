# Vercel serverless backend (shutterlink-two)

## Architecture

| URL | Handler |
|-----|---------|
| `/api/health` | **Static** `public/health.json` (instant, no cold start) |
| `/api/config/public`, `/api/auth/login`, `/api/packages/search`, … | **Thin** `api/**/*.mjs` (Supabase + JWT only, fast) |
| All other `/api/*` | **Express** `api/[[...path]].mjs` + `express-bundle.cjs` (slow cold start) |

Thin routes (avoid 504 on homepage, explore, login):

- `GET /api/config/public`
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/current-user`
- `GET /api/packages/search`
- `GET /api/providers/featured`
- `GET /api/public/portfolio-albums`
- `GET /api/public/providers/:id/details`
- `GET /api/reviews/provider/:id`
- `GET /api/availability/provider/:id/schedules`
- `GET /api/availability/provider/:id/blocked-dates`

**Do not** add a `vercel.json` rewrite that sends all `/api/*` to a single `api/index.js` — that forces every request through Express and causes timeouts.

## Vercel project settings

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Framework | **Other** |
| Install Command | `npm install --include=dev` |
| Build Command | `npm run build && npm run build:vercel` |
| Output Directory | *(empty)* |

## Environment variables (backend Vercel project)

Copy from `backend/.env`:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (min 32 characters)
- `CORS_ORIGIN` = `https://shutterlink-pxj5.vercel.app`
- `ALLOW_VERCEL_PREVIEW_ORIGINS` = `true`
- `PAYMENT_SANDBOX_MODE` = `true`
- `PORTFOLIO_STORAGE`, `CLOUDINARY_*`

## Frontend (shutterlink-pxj5)

```env
NEXT_PUBLIC_API_URL=https://shutterlink-two.vercel.app/api
```

Redeploy frontend after changing this.

## Deploy steps

1. Push latest `backend/` to the branch connected to **shutterlink-two**
2. Vercel → **shutterlink-two** → Redeploy (clear cache if health still 504)
3. Build log must show: `✓ Bundled API → api/express-bundle.cjs`
4. Test (should respond in under ~3s):

   - https://shutterlink-two.vercel.app/api/health → `"runtime":"static"`
   - https://shutterlink-two.vercel.app/api/config/public
   - https://shutterlink-two.vercel.app/api/providers/featured?limit=3

5. Dashboard bookings/payments still use Express fallback — first hit after idle may be slow on **Hobby** (10s limit).

## Limits

| Plan | Max function time | Thin routes | Express fallback |
|------|-------------------|-------------|------------------|
| Hobby | 10s | Usually OK | Often 504 on cold start |
| Pro | 60s | OK | Set `maxDuration: 60` on `api/[[...path]].mjs` |

If **only** dashboard routes 504 but homepage works, thin routes are working — upgrade Pro or use Render for heavy routes ([DEPLOY_RENDER_NOW.md](./DEPLOY_RENDER_NOW.md)).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/api/health` 504 | Old deploy with catch-all rewrite; redeploy latest `vercel.json` (no `/api` → `index` rewrite) |
| `/api/config/public` 504 | Confirm file `api/config/public.mjs` exists in deploy; not routed to Express |
| Login 504 but health OK | `api/auth/login.mjs` missing or rewrite overrides filesystem |
| Bookings 504 | Expected on Hobby for Express; retry or Pro/Render |
