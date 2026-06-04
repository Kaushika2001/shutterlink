# Fix 504 timeout — host API on Render (not Vercel)

**Vercel serverless cannot run this Express API reliably** (504 / FUNCTION_INVOCATION_TIMEOUT).

Use:

| Service | Host | URL |
|---------|------|-----|
| Frontend | Vercel | https://shutterlink-pxj5.vercel.app |
| **API** | **Render** | https://YOUR-SERVICE.onrender.com |

You can **pause or delete** the Vercel project `shutterlink-two` — it is not needed.

---

## Step 1 — Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Web Service**
3. Connect GitHub repo `Kaushika2001/shutterlink`
4. Settings:

| Field | Value |
|-------|--------|
| Name | `shutterlink-api` |
| Region | Singapore or closest to you |
| Branch | `production` |
| Root Directory | **`backend`** |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

5. **Advanced** → Health Check Path: `/api/health`

---

## Step 2 — Environment variables (Render → Environment)

Paste from your `backend/.env`:

| Key | Your value |
|-----|------------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `SUPABASE_URL` | from Supabase |
| `SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **required** |
| `JWT_SECRET` | 32+ chars (production secret) |
| `CORS_ORIGIN` | `https://shutterlink-pxj5.vercel.app` |
| `ALLOW_VERCEL_PREVIEW_ORIGINS` | `true` |
| `PAYMENT_SANDBOX_MODE` | `true` |
| `PORTFOLIO_STORAGE` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | … |
| `CLOUDINARY_API_KEY` | … |
| `CLOUDINARY_API_SECRET` | … |
| `CLOUDINARY_UPLOAD_PRESET` | `shutterlink_portfolio` |

Do **not** set `PORT` — Render sets it automatically.

After first deploy, set (replace with your Render URL):

| Key | Example |
|-----|---------|
| `PAYMENT_WEBHOOK_BASE_URL` | `https://shutterlink-api.onrender.com` |
| `PAYMENT_RETURN_URL` | `https://shutterlink-pxj5.vercel.app/dashboard/payments/return` |

6. **Create Web Service** → wait until **Live** (first deploy ~5–10 min).

---

## Step 3 — Test Render API

Replace with your URL from Render dashboard:

```text
https://shutterlink-api.onrender.com/api/health
https://shutterlink-api.onrender.com/api/config/public
```

Both must return JSON. First request after idle may take ~30s (free tier wake-up).

---

## Step 4 — Point frontend to Render

**Vercel → shutterlink-pxj5 → Settings → Environment Variables**

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | same as Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |

**Deployments → Redeploy** (required).

---

## Step 5 — Local `.env` (optional)

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-URL.onrender.com/api
```

`backend/.env` — keep for local `npm run dev` on port 5000.

---

## Step 6 — Stop using Vercel for API

- **shutterlink-two** Vercel project → **Pause** or delete (optional)
- All API traffic goes to Render only

---

## Checklist

- [ ] Render service **Live**
- [ ] `/api/health` on Render returns OK
- [ ] Frontend `NEXT_PUBLIC_API_URL` ends with `/api`
- [ ] Frontend redeployed
- [ ] Login works on https://shutterlink-pxj5.vercel.app
- [ ] Network tab shows requests to `*.onrender.com/api`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Render build fails `tsc not found` | Build command must include `--include=dev` |
| 502 on Render | Check logs; verify `SUPABASE_SERVICE_ROLE_KEY` |
| CORS error | `CORS_ORIGIN=https://shutterlink-pxj5.vercel.app` on Render |
| Slow first request | Render free tier cold start — normal |
| Frontend still calls shutterlink-two | Update `NEXT_PUBLIC_API_URL` and **Redeploy** |
