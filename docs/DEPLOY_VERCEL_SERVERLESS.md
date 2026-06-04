# Vercel serverless backend (shutterlink-two)

## Architecture

| URL | Handler |
|-----|---------|
| `/api/health` | **Static** `public/health.json` (no serverless — instant) |
| `/api/auth/...`, `/api/config/...`, etc. | **Serverless** `api/index.js` + `express-bundle.cjs` |

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
- `JWT_SECRET`
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

1. Push `production` branch with latest `backend/` files
2. Vercel **shutterlink-two** → Redeploy
3. Build log must show: `✓ Bundled API → api/express-bundle.cjs`
4. Test:
   - https://shutterlink-two.vercel.app/api/health → instant JSON
   - https://shutterlink-two.vercel.app/api/config/public → may take 5–15s **first time**

## Limits (important)

| Plan | Max function time | Reality |
|------|-------------------|---------|
| Hobby | 10 seconds | First Express request after idle often **fails** with 504 |
| Pro | 60 seconds | Set `maxDuration: 60` in `backend/vercel.json` + `api/index.js` |

If login/API routes return **504**, upgrade to **Vercel Pro** or use **Render** ([DEPLOY_RENDER_NOW.md](./DEPLOY_RENDER_NOW.md)).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/api/health` 504 | Push latest code; health must be **static** (check build log) |
| `/api/config/public` 504 | Cold start too slow on Hobby — retry twice or use Pro/Render |
| `API failed to start` | `build:vercel` failed — check `express-bundle.cjs` in build output |
| CORS | Set `CORS_ORIGIN` to exact frontend URL |
