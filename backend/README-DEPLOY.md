# Backend deployment

## VPS (Ubuntu + PM2 + Nginx) **← own server**

See [../docs/DEPLOY_VPS.md](../docs/DEPLOY_VPS.md)

Quick start on the server:

```bash
cd backend
cp .env.example .env   # edit with production values
npm ci && npm run build && npm run check:env
pm2 start ecosystem.config.cjs
```

Updates: `bash scripts/deploy-vps.sh`

## Vercel serverless (separate project, e.g. shutterlink-two)

See [../docs/DEPLOY_VERCEL_SERVERLESS.md](../docs/DEPLOY_VERCEL_SERVERLESS.md)

- `/api/health` = static file (fast)
- Other routes = Express bundle (may be slow on Hobby plan)

## Render (recommended if Vercel times out)

See [../docs/DEPLOY_RENDER_NOW.md](../docs/DEPLOY_RENDER_NOW.md)

## Local dev

```bash
npm install
npm run dev
```
