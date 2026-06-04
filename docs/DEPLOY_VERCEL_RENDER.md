# Deploy: Vercel (frontend) + Render (backend)

Deploy **backend on Render first**, then **frontend on Vercel**, then update CORS on Render.

Example URLs (yours will differ):

| Service | Example |
|---------|---------|
| Render API | `https://shutterlink-api.onrender.com` |
| Vercel app | `https://shutterlink.vercel.app` |

---

## Step 0 — Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **SQL Editor** — run migrations / `RUN_*.sql` scripts under `backend/supabase/` if tables are missing.
3. **Project Settings → API** — copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` → `SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY` (backend only, never on Vercel)

---

## Step 1 — Render (backend)

### Create Web Service

1. [render.com](https://render.com) → **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Settings:

| Field | Value |
|-------|--------|
| **Name** | `shutterlink-api` (or any name) |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

Or use the repo **`render.yaml`** blueprint (same settings).

> Render sets **`PORT`** automatically. Do not hardcode `PORT=5000` in Render env.

### Environment variables (Render → Environment)

Copy values from your local `backend/.env` where applicable.

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (required) |
| `JWT_SECRET` | random 32+ characters (new for production) |
| `CORS_ORIGIN` | `https://YOUR-PROJECT.vercel.app` (update after Step 2) |
| `ALLOW_VERCEL_PREVIEW_ORIGINS` | `true` (allows `*.vercel.app` preview deploys) |
| `PAYMENT_SANDBOX_MODE` | `true` until gateways are live |
| `PAYMENT_WEBHOOK_BASE_URL` | `https://YOUR-SERVICE.onrender.com` (no `/api`) |
| `PAYMENT_RETURN_URL` | `https://YOUR-PROJECT.vercel.app/dashboard/payments/return` |
| `PORTFOLIO_STORAGE` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | … |
| `CLOUDINARY_API_KEY` | … |
| `CLOUDINARY_API_SECRET` | … |

4. **Create Web Service** → wait for deploy.
5. Copy your live URL, e.g. `https://shutterlink-api.onrender.com`.

### Verify Render

```text
https://shutterlink-api.onrender.com/api/health
https://shutterlink-api.onrender.com/api/config/public
```

Both should return JSON. `status` should be `OK` (fix any items in `production_env_issues`).

> **Free tier:** service sleeps after inactivity; first request may take ~30–60s (cold start).

---

## Step 2 — Vercel (frontend)

### Import project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import repo.
2. **Root Directory** → Edit → set to **`frontend`** (required).
3. Framework: **Next.js** (auto-detected).

### Environment variables (Vercel → Settings → Environment Variables)

Apply to **Production** (and **Preview** if you test PR deploys):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://shutterlink-api.onrender.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | same as backend `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as backend `SUPABASE_ANON_KEY` |

**Must end with `/api`** on `NEXT_PUBLIC_API_URL`.

4. **Deploy**.

5. Copy your Vercel URL, e.g. `https://shutterlink.vercel.app`.

### Verify Vercel

1. Open the site → DevTools → **Network**.
2. Requests should go to `https://….onrender.com/api/...`, not `localhost`.
3. Test login, Explore, provider profile.

---

## Step 3 — Link frontend ↔ backend (CORS)

On **Render** → your service → **Environment**:

```env
CORS_ORIGIN=https://shutterlink.vercel.app
```

If you use a custom domain on Vercel:

```env
CORS_ORIGIN=https://shutterlink.vercel.app,https://www.yourdomain.com
```

Update payment URLs to match:

```env
PAYMENT_RETURN_URL=https://shutterlink.vercel.app/dashboard/payments/return
```

**Save** → Render redeploys automatically.

On **Vercel**, if the Render URL changed, update `NEXT_PUBLIC_API_URL` and **Redeploy** (env vars are baked in at build time).

---

## Step 4 — Optional custom domains

| Platform | Domain |
|----------|--------|
| Vercel | `app.yourdomain.com` → add in Vercel Domains |
| Render | `api.yourdomain.com` → Render Custom Domains |

Then update:

- Vercel: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api` → **Redeploy**
- Render: `CORS_ORIGIN=https://app.yourdomain.com`, `PAYMENT_WEBHOOK_BASE_URL=https://api.yourdomain.com`

---

## Quick checklist

- [ ] Render root directory = `backend`
- [ ] Vercel root directory = `frontend`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only on Render
- [ ] `NEXT_PUBLIC_API_URL` ends with `/api`
- [ ] `CORS_ORIGIN` = exact Vercel URL (no trailing slash)
- [ ] Health: `/api/health` returns OK
- [ ] Login works from Vercel URL

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Match `CORS_ORIGIN` to browser URL; or `ALLOW_VERCEL_PREVIEW_ORIGINS=true` |
| API calls localhost | Set `NEXT_PUBLIC_API_URL` on Vercel → **Redeploy** |
| 502 / timeout on API | Render cold start — wait and retry |
| RLS errors | Add `SUPABASE_SERVICE_ROLE_KEY` on Render |
| Build fails on Render | Confirm **Root Directory** = `backend` |

See also: [DEPLOYMENT.md](./DEPLOYMENT.md) for full env reference.
