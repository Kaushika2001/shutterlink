# Deploy ShutterLink backend on a VPS (Ubuntu)

This guide runs the Express API on your own server with **Node 20**, **PM2**, **Nginx**, and **Let's Encrypt SSL**.

Typical setup:

| Piece | Example |
|-------|---------|
| VPS | Ubuntu 22.04/24.04, 1 GB+ RAM |
| API domain | `api.yourdomain.com` |
| Frontend | Vercel / another host → set `CORS_ORIGIN` to that URL |
| Process manager | PM2 |
| Reverse proxy | Nginx → `localhost:5000` |

---

## 1. Prepare the VPS

SSH into the server:

```bash
ssh root@YOUR_VPS_IP
```

Update packages and create a deploy user (recommended):

```bash
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Log in as `deploy` for the rest:

```bash
su - deploy
```

Install Node 20, Git, Nginx, and Certbot:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2
node -v   # should be v20.x
```

Open firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 2. DNS

In your domain registrar, add an **A record**:

| Type | Name | Value |
|------|------|-------|
| A | `api` | `YOUR_VPS_IP` |

Wait a few minutes, then verify:

```bash
dig +short api.yourdomain.com
```

---

## 3. Clone the project

```bash
sudo mkdir -p /var/www/shutterlink
sudo chown deploy:deploy /var/www/shutterlink
cd /var/www/shutterlink
git clone https://github.com/YOUR_USER/shutterlink.git .
# Or upload only backend/ if you prefer a minimal deploy
```

---

## 4. Production environment file

On the VPS, create `backend/.env` (never commit this file):

```bash
cd /var/www/shutterlink/backend
cp .env.example .env
nano .env
```

**Minimum production values:**

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

JWT_SECRET=your-random-32-plus-character-secret

# Your live frontend URL (comma-separated if you have www + apex)
CORS_ORIGIN=https://your-frontend.vercel.app

PORTFOLIO_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payments — use your public API domain (no /api suffix)
PAYMENT_SANDBOX_MODE=false
PAYMENT_WEBHOOK_BASE_URL=https://api.yourdomain.com
PAYMENT_RETURN_URL=https://your-frontend.vercel.app/dashboard/payments/return

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Validate before starting:

```bash
npm install
npm run build
npm run check:env
```

`check:env` must pass with no errors in production.

---

## 5. Build and start with PM2

```bash
cd /var/www/shutterlink/backend
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command PM2 prints (sudo env PATH=...)
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs shutterlink-api
pm2 restart shutterlink-api
```

Smoke test on the server:

```bash
curl -s http://127.0.0.1:5000/api/health | head
```

---

## 6. Reverse proxy

### Option A — Nginx Proxy Manager (Docker, port 80/443 already in use)

If `docker ps` shows `nginx-proxy-manager` on ports 80–443, **do not start host nginx**. Use NPM:

1. API runs on PM2 at `http://127.0.0.1:5000`
2. Open NPM admin: `http://YOUR_VPS_IP:81`
3. **Hosts → Proxy Hosts → Add Proxy Host**
   - Domain: `api.yourdomain.com`
   - Forward to `127.0.0.1` (or `host.docker.internal` if 127.0.0.1 fails), port `5000`
4. **SSL** tab → Let's Encrypt → Force SSL

If NPM cannot reach the API, use the Docker host gateway IP:

```bash
ip route | grep default | awk '{print $3}'
```

### Option B — Host Nginx (no Docker proxy on 80)

Copy the example config and edit your domain:

```bash
sudo cp /var/www/shutterlink/backend/deploy/nginx-shutterlink-api.conf.example \
  /etc/nginx/sites-available/shutterlink-api
sudo nano /etc/nginx/sites-available/shutterlink-api
# Replace api.yourdomain.com with your real subdomain
sudo ln -sf /etc/nginx/sites-available/shutterlink-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Enable HTTPS:

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Test from your laptop:

```bash
curl https://api.yourdomain.com/api/health
curl https://api.yourdomain.com/api/config/public
```

---

## 7. Stripe webhook (if using live/test Checkout)

In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add endpoint:

```
https://api.yourdomain.com/api/payments/webhooks/stripe
```

Events: `checkout.session.completed` (and related payment events you use).

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` on the VPS, then:

```bash
pm2 restart shutterlink-api
```

---

## 8. Point the frontend at the VPS API

On Vercel (or wherever the Next.js app runs), set:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Redeploy the frontend after changing env vars.

---

## 9. Deploy updates later

From the VPS:

```bash
cd /var/www/shutterlink/backend
bash scripts/deploy-vps.sh
```

Or manually:

```bash
cd /var/www/shutterlink
git pull
cd backend
npm ci
npm run build
npm run check:env
pm2 restart shutterlink-api
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Production environment incomplete` on start | Run `npm run check:env`; fix missing vars in `.env` |
| CORS errors in browser | `CORS_ORIGIN` must exactly match frontend URL (https, no trailing slash) |
| 502 Bad Gateway | `pm2 status` — app crashed? Check `pm2 logs shutterlink-api` |
| RLS / 42501 on bookings | Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` |
| Payments redirect to localhost | Set `PAYMENT_RETURN_URL` and rebuild/restart |
| Stripe webhook fails | URL must be HTTPS; set `STRIPE_WEBHOOK_SECRET`; Nginx must not strip body |
| API still on port 5000 only | Configure Nginx + DNS; do not expose 5000 in UFW |

---

## Security checklist

- [ ] `.env` is only on the server (chmod `600`)
- [ ] `JWT_SECRET` is unique and 32+ characters
- [ ] UFW allows SSH + Nginx only (not public port 5000)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to frontend
- [ ] Rotate any keys that were ever pasted in chat or committed
