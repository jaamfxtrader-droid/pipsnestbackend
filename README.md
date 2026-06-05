# PipNest Markets

Full-stack PERN prop firm platform scaffold for **PipNest Markets** with Next.js, Express, Prisma, PostgreSQL, JWT auth, admin console, trader dashboard, and an MT4/MT5-ready service layer using dummy data for now.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod, Recharts, Lucide React
- Backend: Node.js, Express, Prisma ORM, JWT, bcrypt, Zod, RBAC middleware
- Database: Neon PostgreSQL through Prisma
- Deployment target: Vercel frontend, Railway API, Neon PostgreSQL

## Folder Structure

```txt
apps/
  api/
    src/
      config/
      middleware/
      routes/
      services/
      utils/
  web/
    app/
      (public)/
      (legal)/
      auth/
      dashboard/
      admin/
    components/
    lib/
    store/
packages/
  shared/
    src/
prisma/
  migrations/
  schema.prisma
  seed.ts
services/
  mt4.service.ts
  mt5.service.ts
```

## Environment

Create `.env` from `.env.example` and fill values locally or in your deployment provider.

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=http://localhost:4000/api
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
MT5_SERVER=
MT5_MANAGER_LOGIN=
MT5_MANAGER_PASSWORD=
MT4_SERVER=
MT4_MANAGER_LOGIN=
MT4_MANAGER_PASSWORD=
```

Do not expose `DATABASE_URL`, `DIRECT_URL`, JWT secrets, payment secrets, or MT4/MT5 manager credentials to the frontend.

Avoid setting `NODE_ENV=development` in `.env` when running `next build`. Use the shell or deployment provider environment for `NODE_ENV`; production builds should run with `NODE_ENV=production`.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`

For Vercel + Railway deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Demo seed users:

- Admin: `admin@pipnestfunding.com` / `Pipnest@123`
- Trader: `trader@pipnestfunding.com` / `Pipnest@123`

## API Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

Challenges:

- `GET /api/challenges`
- `GET /api/challenges/:id`
- `POST /api/admin/challenges`
- `PUT /api/admin/challenges/:id`
- `DELETE /api/admin/challenges/:id`

Orders and payments:

- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/admin/orders`
- `POST /api/payments/create`
- `POST /api/payments/webhook`
- `GET /api/admin/payments`

Trading accounts:

- `GET /api/trading-accounts/my`
- `POST /api/admin/trading-accounts/assign`
- `GET /api/admin/trading-accounts`
- `POST /api/trading-accounts/sync`

Payouts:

- `POST /api/payouts/request`
- `GET /api/payouts/my`
- `GET /api/admin/payouts`
- `PUT /api/admin/payouts/:id/status`

Support:

- `POST /api/support/tickets`
- `GET /api/support/tickets/my`
- `POST /api/support/tickets/:id/reply`
- `GET /api/admin/support/tickets`
- `PUT /api/admin/support/tickets/:id/status`

Affiliate and admin:

- `GET /api/affiliate/me`
- `GET /api/affiliate/referrals`
- `GET /api/admin/affiliate`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/reports`

## MT4/MT5 Integration

Real Manager API integration is intentionally not implemented yet. The dummy services live at:

- `apps/api/src/services/mt5.service.ts`
- `apps/api/src/services/mt4.service.ts`

Connect the official Manager API SDK or bridge in those files later. Keep credentials in environment variables only:

- `MT5_SERVER`
- `MT5_MANAGER_LOGIN`
- `MT5_MANAGER_PASSWORD`
- `MT4_SERVER`
- `MT4_MANAGER_LOGIN`
- `MT4_MANAGER_PASSWORD`

## Notes Before Production

- Add real email verification and password reset token persistence.
- Connect a production payment gateway and verify webhook signatures.
- Add refresh tokens or server-side session invalidation if needed.
- Add rate limiting, audit log coverage, and full E2E tests.
- Replace placeholder legal content after legal review.
