# LexSelf — Signal Law Group

AI-guided legal self-service platform. Clients submit cases, attorneys review and approve, documents are delivered.

---

## Prerequisites

- Node.js 18+
- npm
- Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- PostgreSQL via Supabase (configured in `.env`)

---

## Environment Setup

Copy and fill in the `.env` file inside `backend/`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="24h"
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # See Terminal 3 below
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_KEY="..."
SUPABASE_BUCKET="documents"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@signallawgroup.com"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
```

Copy and fill in `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## Running the App — 3 Terminals

### Terminal 1 — Backend (NestJS)

```bash
cd lexself/backend
npm install
npx prisma migrate dev      # run once to set up DB
npx prisma db seed          # run once to seed 8 matters
npm run start:dev
```

Backend runs at: `http://localhost:3001`

---

### Terminal 2 — Frontend (Next.js)

```bash
cd lexself/frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

### Terminal 3 — Stripe Webhook Listener

```bash
stripe listen --forward-to localhost:3001/api/v1/payments/webhook
```

**Important:** Every time you restart this terminal, Stripe prints a new webhook secret like:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

Copy that value and update `STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart Terminal 1.

---

## Test Accounts

Seed or register accounts with these roles:

| Role | Email | Password |
|------|-------|----------|
| Client | client@gmail.com | client@123 |
| Attorney | attorney@gmail.com | attorney@123 |
| Admin | admin@gmail.com | admin@123 |

---

## Portals

| Role | URL | Access |
|------|-----|--------|
| Client | `/matters` | Submit cases, pay, download documents |
| Attorney | `/queue` | Review intake, edit draft, approve, grant access |
| Admin | `/admin/dashboard` | CRM overview, clients by matter, attorney workloads |

---

## Payment Testing (Stripe)

Use Stripe test card: `4242 4242 4242 4242` — any future expiry, any CVC.

---

## Prisma Commands

```bash
# After schema changes:
npx prisma migrate dev --name describe-change
npx prisma generate

# Open Prisma Studio (DB browser):
npx prisma studio
```
