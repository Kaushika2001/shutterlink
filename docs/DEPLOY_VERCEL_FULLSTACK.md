# Deploy frontend + backend on Vercel (serverless API)

One Vercel project runs **Next.js** (frontend) and **Express** (backend) as a serverless function at `/api/*`.

```
Browser  →  https://your-app.vercel.app/dashboard
          →  https://your-app.vercel.app/api/auth/login   (serverless Express)
```

---

## Step 1 — Push code to GitHub

Ensure the repo contains:

- `frontend/` — Next.js app  
- `backend/` — Express API (compiled for serverless)  
- `frontend/api/index.ts` — Vercel function entry  
- `frontend/vercel.json` — build + `/api` rewrites  

---

## Step 2 — Create Vercel project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import GitHub repo.  
2. **Root Directory** → **Edit** → set to **`frontend`**.  
3. **Important:** **Settings → General → Root Directory**  
   - Enable **“Include source files outside of the Root Directory in the Build Step”**  
   - (Required so `../backend` is available for the API build.)

4. Framework: **Next.js** (auto).  
5. Build settings are read from `frontend/vercel.json` (installs & builds backend first).

---

## Step 3 — Environment variables (Vercel → Settings → Environment Variables)

Add for **Production** and **Preview**:

### Supabase (required)

| Key | Value |
|-----|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret |

### Auth (required)

| Key | Value |
|-----|--------|
| `JWT_SECRET` | random 32+ character string |

### Frontend (recommended)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | same as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as `SUPABASE_ANON_KEY` |

### API URL (optional on Vercel)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | leave **empty** to use same-origin `/api`, **or** set `https://your-app.vercel.app/api` |

### App / payments

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `PAYMENT_SANDBOX_MODE` | `true` (until live gateways) |
| `PORTFOLIO_STORAGE` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | … |
| `CLOUDINARY_API_KEY` | … |
| `CLOUDINARY_API_SECRET` | … |

`CORS_ORIGIN`, `PAYMENT_WEBHOOK_BASE_URL`, and `PAYMENT_RETURN_URL` are **auto-filled** from `VERCEL_URL` when omitted.

---

## Step 4 — Deploy

1. Click **Deploy**.  
2. Wait for build (backend `tsc` + Next.js build).  
3. Open `https://YOUR-PROJECT.vercel.app`.

---

## Step 5 — Verify

| URL | Expected |
|-----|----------|
| `https://YOUR-APP.vercel.app` | Homepage loads |
| `https://YOUR-APP.vercel.app/api/health` | JSON `"status": "OK"` |
| `https://YOUR-APP.vercel.app/api/config/public` | `success: true` |

In browser DevTools → **Network**, API calls should go to **`/api/...`** on the same host (not `localhost`).

Test: Register → Login → Explore → Provider profile.

---

## Local development (unchanged)

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd frontend
# frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

---

## Limits (Vercel serverless)

| Topic | Note |
|-------|------|
| **Timeout** | Hobby ~10s, Pro up to 60s (`maxDuration` in `vercel.json`) |
| **Cold start** | First `/api` request after idle can be slow |
| **Body size** | Large portfolio uploads (~10MB) may need Pro plan |
| **WebSockets** | Realtime uses Supabase directly, not Express |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build: cannot find `../backend` | Enable **Include source files outside Root Directory** |
| `Cannot find module 'shutterlink-backend'` | Run `cd frontend && npm install` locally; ensure backend builds on Vercel |
| 404 on `/api/health` | Check `vercel.json` rewrites; redeploy |
| CORS errors | Omit custom `CORS_ORIGIN` or set to `https://YOUR-APP.vercel.app` |
| RLS errors | Set `SUPABASE_SERVICE_ROLE_KEY` on Vercel |

---

## Optional: separate API domain

If you later split API to Render/Railway, set:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
CORS_ORIGIN=https://your-app.vercel.app
```
