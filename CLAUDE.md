# LexSelf — Signal Law Group · CLAUDE.md

AI context file for this codebase. Keep this updated after every significant change.

---

## Project Overview

**LexSelf** is a legal self-service SaaS platform for Signal Law Group (Atlanta, GA).

Clients submit legal matters through an AI chat intake. Attorneys are assigned automatically based on speciality and availability. The platform handles intake → payment → attorney assignment → document delivery.

---

## Architecture

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS (modular monolith), TypeScript |
| ORM | Prisma + `@prisma/adapter-pg` |
| DB | PostgreSQL |
| Auth | JWT (passport-jwt), bcrypt for attorney passwords |
| Payments | Stripe (PaymentIntent + webhook) |
| Email | Nodemailer + Gmail App Password (requires 2FA on Gmail) |
| File Storage | Local disk (StorageService) |

Backend runs on **port 3001**, frontend on **port 3000**.

---

## Database Schema (9 tables)

```
User               — clients (no password, identified by email)
Attorney           — attorneys + admins (bcrypt password, role field)
Speciality         — legal speciality types
AttorneySpeciality — join: attorney ↔ speciality
MatterSpeciality   — join: matter ↔ speciality
Matter             — matter types (DL, CR, TR, EM, BF, EP, SC, CD)
Investigation      — a client's submitted legal matter (renamed from "cases")
IntakeData         — JSON intake answers + chat log for an investigation
Document           — uploaded files for an investigation
Notification       — system notifications per investigation
```

### Key model fields

**User** — `id, full_name, email (unique), phone?, created_at`
**Attorney** — `id, full_name, email (unique), password_hash, role ("attorney"|"admin"), is_available (bool), description?`
**Investigation** — `id, user_id, attorney_id?, matter_id, status, payment_done, amount_paid?, access_granted, submitted_at?`

### Investigation statuses
`draft → submitted → assigned → in_review → approved → delivered`

---

## Matter Types & Specialities

Each matter type has a matching speciality. Seeded via `backend/prisma/seed.ts`.

| Code | Matter Name | Speciality |
|---|---|---|
| DL | Demand Letter | Demand Letter |
| CR | Contract Review | Contract Review |
| TR | Tenant Rights | Tenant Rights |
| EM | Employment Law | Employment Law |
| BF | Business Formation | Business Formation |
| EP | Estate Planning | Estate Planning |
| SC | Small Claims | Small Claims |
| CD | Cease & Desist | Cease & Desist |

---

## API Routes

### Public (no auth)
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/matters` | List all matter types |
| POST | `/api/v1/chat/next` | Get next intake question |
| POST | `/api/v1/auth/register` | Register client (no password) or attorney |
| POST | `/api/v1/auth/login` | Login (attorney/admin only, returns JWT) |
| POST | `/api/v1/investigations/lookup` | Look up investigations by client email |
| GET | `/api/v1/investigations/public/:id` | Get investigation details (no ownership check) |
| POST | `/api/v1/investigations/:id/payment` | Create Stripe PaymentIntent |
| POST | `/api/v1/payments/webhook` | Stripe webhook handler |

### Client (JWT, role=client)
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/investigations` | Get my investigations |
| POST | `/api/v1/investigations` | Create new investigation |
| POST | `/api/v1/investigations/:id/intake` | Save intake data |
| GET | `/api/v1/investigations/:id` | Get investigation (ownership check) |
| GET | `/api/v1/investigations/:id/document` | Get document download |

### Attorney (JWT, role=attorney)
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/attorney/investigations` | List assigned investigations |
| GET | `/api/v1/attorney/investigations/:id` | Get investigation detail |
| PATCH | `/api/v1/attorney/investigations/:id/intake` | Update intake/notes |
| PATCH | `/api/v1/attorney/investigations/:id/approve` | Approve investigation |
| PATCH | `/api/v1/attorney/investigations/:id/grant-access` | Grant document access |
| GET | `/api/v1/attorney/profile` | Get own profile including `is_available` |
| PATCH | `/api/v1/attorney/availability` | Toggle `is_available` |

### Admin (JWT, role=admin)
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/admin/clients` | List all clients |
| GET | `/api/v1/admin/attorneys` | List all attorneys (includes `is_available`) |
| GET | `/api/v1/admin/investigations` | List all investigations |
| POST | `/api/v1/admin/attorneys` | Create attorney |

---

## Frontend Pages

```
/                          → redirects to /matters
/matters                   → Client portal (AI chat intake, matter selector)
/investigations            → Submitted Matters (email lookup popup)
/investigations/[id]       → Investigation detail + payment (public or client)
/auth/login                → Attorney/admin login (+ link to /auth/register)
/auth/register             → Register attorney/admin
/queue                     → Attorney portal (investigation queue + availability toggle)
/attorney/investigations/[id] → Attorney investigation detail
/admin/clients             → Admin: client list
/admin/attorneys           → Admin: attorney list with availability status
/admin/dashboard           → Admin: dashboard
/dashboard                 → Client dashboard (legacy)
```

---

## Key Frontend Files

```
frontend/
  app/
    matters/page.tsx           — AI chat intake page (main client portal)
    investigations/page.tsx    — Email lookup for submitted matters
    investigations/[id]/page.tsx — Investigation detail + Stripe payment
    queue/page.tsx             — Attorney portal with availability toggle
    admin/attorneys/page.tsx   — Admin: attorney list with availability badge
  components/
    Navbar.tsx                 — Logo links to /matters; shows nav by role
  lib/
    api.ts                     — Axios instance (baseURL port 3001, JWT interceptor)
  middleware.ts                — Route protection; public paths include /investigations
```

---

## Authentication Flow

- **Clients** — no password. Identified by email. `POST /auth/register` with `role: 'client'` finds-or-creates the user and returns a JWT.
- **Attorneys/Admins** — bcrypt password. Login via `POST /auth/login`. JWT stored in `localStorage` + cookie.
- **Role** stored in `localStorage` as `role` key (`"client"` | `"attorney"` | `"admin"`).
- **API interceptor** (`lib/api.ts`) auto-attaches JWT. On 401, clears storage and redirects to login **only for attorney/admin** — client portal handles 401 inline.

---

## Client Portal Flow

1. User visits `/matters`, selects a matter type from the sidebar.
2. AI chat collects intake answers question by question (`POST /chat/next`).
3. After the **last question is answered**, "Submit my case →" button appears.
4. Button always opens the **identity modal** (name + email + phone).
5. Modal submits `POST /auth/register` → gets JWT → then `POST /investigations` → `POST /investigations/:id/intake` → redirects to `/investigations/:id`.
6. Investigation detail page shows payment flow (Stripe).
7. After payment, Stripe webhook fires → `payment_done=true`, `status=submitted` → matching runs.

---

## Attorney Availability & Matching

### Availability toggle
- Attorney portal (`/queue`) fetches live `is_available` from `GET /attorney/profile` on every load (not from localStorage).
- Toggle calls `PATCH /attorney/availability` → flips the boolean in DB.
- When toggling **to available**: automatically retries all pending investigations (`status=submitted, payment_done=true`).

### Matching rules (MatchingService)
- Only available attorneys (`is_available=true`, `role='attorney'`) are candidates.
- If the matter has specialities → **only** attorneys with matching speciality are considered.
- If no specialized attorney is available → set `status=submitted, attorney_id=null` and wait. **No fallback to general pool.**
- Among eligible attorneys → assign to the one with **fewest active investigations** (load balance).
- When attorney becomes available → retry is triggered automatically.

---

## Running the Project

```bash
# Backend
cd backend
npm run start:dev        # NestJS on port 3001

# Frontend
cd frontend
npm run dev              # Next.js on port 3000

# If port 3001 is stuck:
lsof -ti :3001 | xargs kill -9
```

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MAIL_USER=your@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx   # Gmail App Password (requires 2FA)
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Seeding

```bash
cd backend
npx prisma db seed
```

Seeds: 8 matter types, 8 specialities, `MatterSpeciality` links. Does **not** seed attorneys — create via admin portal or direct DB insert.

---

## Common Issues

| Problem | Fix |
|---|---|
| Port 3001 in use | `lsof -ti :3001 \| xargs kill -9` |
| Gmail SMTP failing | Use App Password (not account password); requires 2FA enabled |
| Attorney not assigned | Check `is_available=true` and speciality matches matter |
| Pending investigations not auto-assigned | Toggle attorney to unavailable then back to available |
| Modal not showing on client portal | Identity modal always shows on "Submit my case" click; fields reset each time |
