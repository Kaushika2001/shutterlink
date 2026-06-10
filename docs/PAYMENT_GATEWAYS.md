# ShutterLink Payments — Stripe (test) + PayHere (production SL)

| Environment | Gateway | Notes |
|-------------|---------|--------|
| **Development** | Stripe test keys | Card `4242 4242 4242 4242` |
| **Production (Sri Lanka)** | PayHere | Stripe does not onboard SL merchants for live payouts |

## Stripe setup (your sandbox keys)

In `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from Stripe CLI (optional for return-page sync)

PAYMENT_SANDBOX_MODE=false
PAYMENT_RETURN_URL=http://localhost:3000/dashboard/payments/return
```

Restart backend — log should show `✓ Stripe configured`.

### Local webhook (optional)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhooks/stripe
```

Copy the `whsec_...` secret into `STRIPE_WEBHOOK_SECRET`.

Without webhook, the **return page** still syncs payment via `GET /api/payments/:id/status`.

### Test card

- Number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

## Flow

1. **Pay Now** → Stripe Checkout
2. Pay with test card
3. Return to `/dashboard/payments/return` → booking deposit marked paid

## Security

Never commit `.env` or paste secret keys in chat. Rotate keys in [Stripe Dashboard](https://dashboard.stripe.com/apikeys) if exposed.
