# Backend deployment

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
