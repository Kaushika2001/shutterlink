# Two Vercel projects: frontend + backend

| Project | Root Directory | URL example |
|---------|----------------|---------------|
| **shutterlink-web** | `frontend` | `https://shutterlink.vercel.app` |
| **shutterlink-api** | `backend` | `https://shutterlink-api.vercel.app` |

---

## Part 1 — Backend project (new)

### 1. Create project

1. [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the **same GitHub repo** again (second project).
3. **Project name:** e.g. `shutterlink-api`.
4. **Root Directory:** `backend` (not `frontend`).
5. **Framework Preset:** **Other** (not Next.js).
6. Build settings (or use `backend/vercel.json`):

| Field | Value |
|-------|--------|
| Build Command | `npm run build` |
| Output Directory | leave empty |
| Install Command | `npm install --include=dev` (needs TypeScript for `tsc`) |

7. Do **not** enable “Include files outside root” (not needed).

### 2. Environment variables (backend project)

Add all secrets here (from `backend/.env`):

| Variable | Required |
|----------|----------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | yes |
| `SUPABASE_ANON_KEY` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | yes |
| `JWT_SECRET` | yes (32+ chars) |
| `CORS_ORIGIN` | your **frontend** Vercel URL, e.g. `https://shutterlink.vercel.app` |
| `ALLOW_VERCEL_PREVIEW_ORIGINS` | `true` |
| `PAYMENT_SANDBOX_MODE` | `true` |
| `PAYMENT_WEBHOOK_BASE_URL` | `https://shutterlink-api.vercel.app` |
| `PAYMENT_RETURN_URL` | `https://shutterlink.vercel.app/dashboard/payments/return` |
| `PORTFOLIO_STORAGE` | `cloudinary` |
| `CLOUDINARY_*` | if using Cloudinary |

### 3. Deploy backend

1. Click **Deploy**.
2. Copy the API URL, e.g. `https://shutterlink-api.vercel.app`.

### 4. Test backend

Open in browser:

- `https://shutterlink-api.vercel.app/api/health`
- `https://shutterlink-api.vercel.app/api/config/public`

Both must return JSON.

---

## Part 2 — Frontend project (already deployed)

### 1. Environment variables (frontend project)

**Settings → Environment Variables:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://shutterlink-api.vercel.app/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | same as backend `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as backend anon key |

Use your **real** backend URL from Part 1.

### 2. Redeploy frontend

**Deployments → … → Redeploy** (required after changing `NEXT_PUBLIC_*`).

### 3. Test frontend

1. Open `https://your-frontend.vercel.app`.
2. DevTools → **Network** → login or explore.
3. Requests must go to `https://shutterlink-api.vercel.app/api/...`, not localhost.

---

## Part 3 — Connect CORS

On the **backend** project, set:

```env
CORS_ORIGIN=https://your-actual-frontend.vercel.app
```

No trailing slash. Save → backend redeploys.

---

## Checklist

- [ ] Backend project Root Directory = `backend`
- [ ] Frontend project Root Directory = `frontend`
- [ ] Backend `/api/health` works
- [ ] Frontend `NEXT_PUBLIC_API_URL` ends with `/api`
- [ ] Frontend redeployed after env change
- [ ] `CORS_ORIGIN` on backend = frontend URL
- [ ] Login works on frontend URL

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Fix `CORS_ORIGIN` on **backend** project |
| API calls localhost | Set `NEXT_PUBLIC_API_URL` on **frontend** → Redeploy |
| Backend 404 | Root must be `backend`; check `backend/api/index.ts` exists |
| Build: `tsc: command not found` | Set Install Command to `npm install --include=dev` |
| Build stops after `npm install` | Push latest `backend/vercel.json`; confirm **Root Directory** = `backend` |
| `FUNCTION_INVOCATION_TIMEOUT` on `/api/health` | Push latest code: `api/index.js` returns health **before** loading Express. Test `/api/health` first. |
| Timeout on login/API routes | Vercel Hobby = 10s max. Use **Render** for backend (see below) or Vercel Pro (60s). |

## If Vercel API keeps timing out — use Render (recommended for Express)

1. [render.com](https://render.com) → Web Service → Root **`backend`**
2. Build: `npm install --include=dev && npm run build` · Start: `npm start`
3. Env: same as backend table above; `CORS_ORIGIN=https://shutterlink-pxj5.vercel.app`
4. Frontend: `NEXT_PUBLIC_API_URL=https://YOUR-APP.onrender.com/api`

Express runs continuously on Render — no 10s serverless limit.
| Frontend still has `/api` route | Remove `frontend/api/` folder; redeploy frontend |
