# ShutterLink Payment Gateways

## Overview

| SRS method | Integration | Webhook |
|------------|-------------|---------|
| **OnePay** | [OnePay API v3](https://developer.onepay.lk/payment-api.html) checkout link | `POST /api/payments/webhooks/onepay` |
| **HelaPay** | PayHere IPG (standard Sri Lanka checkout used with HelaPay) | `POST /api/payments/webhooks/helapay` |
| **Card / Bank** | Manual complete (development / fallback) | — |

## Environment variables

Add to `backend/.env`:

```env
ONEPAY_APP_ID=your_app_id
ONEPAY_APP_TOKEN=your_app_token
ONEPAY_HASH_SALT=your_hash_salt

PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_secret
PAYHERE_SANDBOX=true

PAYMENT_WEBHOOK_BASE_URL=https://your-api.example.com
PAYMENT_RETURN_URL=https://your-app.example.com/dashboard/payments/return
```

### Local development with webhooks

Use [ngrok](https://ngrok.com) or similar:

```bash
ngrok http 5000
```

Set `PAYMENT_WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app` and register:

- OnePay callback: `https://xxxx.ngrok-free.app/api/payments/webhooks/onepay`
- PayHere notify: `https://xxxx.ngrok-free.app/api/payments/webhooks/helapay`

## Flow

1. Customer clicks **Pay Now** → `POST /api/payments/checkout`
2. Backend creates pending payment and returns `redirect_url` (if gateway configured)
3. Customer pays on OnePay / PayHere
4. Gateway calls webhook → booking set to **confirmed**, `deposit_paid=true`
5. Customer lands on `/dashboard/payments/return` → `GET /api/payments/:id/status` syncs OnePay status

## OnePay callback payload (example)

```json
{
  "transaction_id": "WQBV118E584C83CBA50C6",
  "status": 1,
  "status_message": "SUCCESS",
  "additional_data": "<payment-uuid>"
}
```

Server verifies via `POST https://api.onepay.lk/v3/transaction/status/` before confirming.

## Without gateway credentials

Checkout returns `mode: "simulate"`. Use **Pay Now** to call `POST /api/payments/:id/complete` (development only).
