# ShutterLink SRS Test Checklist

Use this checklist to verify the system against the Software Requirements Specification.

**Prerequisites**

- [ ] `backend/.env` configured (Supabase, JWT, Cloudinary)
- [ ] Migration `016_srs_disputes_audit_password.sql` applied in Supabase
- [ ] Backend: `cd backend && npm run dev` (port 5000)
- [ ] Frontend: `cd frontend && npm run dev` (port 3000)
- [ ] `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

---

## Module 1 — Authentication (FR-1–4)

| # | Test | Pass |
|---|------|------|
| 1.1 | Register as **customer** | ☐ |
| 1.2 | Register as **provider** (admin not allowed on public register) | ☐ |
| 1.3 | Login / logout | ☐ |
| 1.4 | Forgot password → email / dev token | ☐ |
| 1.5 | Reset password at `/reset-password?token=...` | ☐ |
| 1.6 | Customer cannot access `/provider` routes | ☐ |
| 1.7 | Provider cannot access `/admin` routes | ☐ |

---

## Module 2 — Discovery (FR-5–8)

| # | Test | Pass |
|---|------|------|
| 2.1 | `/explore` — Service Packages tab loads | ☐ |
| 2.2 | Filter by price, rating, service type | ☐ |
| 2.3 | Filter **Available providers only** | ☐ |
| 2.4 | `/explore?tab=portfolios` — album grid | ☐ |
| 2.5 | Open album → portfolio photos + packages | ☐ |
| 2.6 | Only **verified** providers in explore (after admin verify) | ☐ |

---

## Module 3 — Booking (FR-9–12)

| # | Test | Pass |
|---|------|------|
| 3.1 | Guest redirected to login when booking | ☐ |
| 3.2 | Book package — unavailable slot rejected | ☐ |
| 3.3 | Booking created with status **pending** | ☐ |
| 3.4 | Provider sees booking in Provider → Bookings | ☐ |
| 3.5 | Provider can reject pending booking | ☐ |
| 3.6 | Provider **cannot** confirm unpaid booking | ☐ |
| 3.7 | After payment, booking status **confirmed** | ☐ |
| 3.8 | Provider can mark confirmed booking **completed** | ☐ |

---

## Module 4 — Payments (FR-13–16)

| # | Test | Pass |
|---|------|------|
| 4.1 | Pending payment listed on Dashboard → Payments | ☐ |
| 4.2 | **OnePay** redirect (if `ONEPAY_*` env set) | ☐ |
| 4.3 | OnePay webhook confirms booking | ☐ |
| 4.4 | **HelaPay** redirect via PayHere (if `PAYHERE_*` set) | ☐ |
| 4.5 | PayHere notify webhook confirms booking | ☐ |
| 4.6 | Return URL `/dashboard/payments/return` syncs status | ☐ |
| 4.7 | Without gateway keys — simulate pay completes booking | ☐ |
| 4.8 | Transaction history shows completed payment | ☐ |

---

## Module 5 — Portfolio & Reviews (FR-17–19)

| # | Test | Pass |
|---|------|------|
| 5.1 | Provider uploads portfolio (Cloudinary) | ☐ |
| 5.2 | Portfolio visible on explore albums | ☐ |
| 5.3 | Customer leaves review after completed booking | ☐ |
| 5.4 | Reviews on public provider profile | ☐ |

---

## Module 6 — Admin (FR-20–23)

| # | Test | Pass |
|---|------|------|
| 6.1 | Admin login | ☐ |
| 6.2 | Dashboard stats load (users, revenue chart) | ☐ |
| 6.3 | **Verify provider** — appears in explore | ☐ |
| 6.4 | Revoke provider verification | ☐ |
| 6.5 | Users list — activate/deactivate | ☐ |
| 6.6 | Bookings / payments monitoring | ☐ |

---

## Business rules

| Rule | Pass |
|------|------|
| Book only if available | ☐ |
| Must be logged in to book | ☐ |
| Confirmed only after successful payment | ☐ |
| Audit log entries in `audit_logs` table | ☐ |

---

## API smoke tests (Postman / curl)

```bash
curl http://localhost:5000/api/health
```

| Endpoint | Method |
|----------|--------|
| `/api/auth/register` | POST |
| `/api/payments/checkout` | POST (Bearer) |
| `/api/payments/webhooks/onepay` | POST |
| `/api/payments/webhooks/helapay` | POST |
| `/api/admin/providers/:id/verify` | PUT (admin Bearer) |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Developer | | |
| Tester | | |
| Client | | |
