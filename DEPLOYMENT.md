# Deployment

This repo is set up for a split deployment:

- Frontend: Vercel, from `apps/web`
- API: Railway, from the repository root using `railway.json`
- Database: Neon PostgreSQL

## Railway API

Create one Railway service from this repo and keep the root directory as `/`.

Railway will use `railway.json`:

- Build command: `npm run build:api`
- Start command: `npm run start:api`
- Health check: `/api/health`

Set these Railway variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
RESEND_API_KEY=
RESEND_FROM=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MT5_SERVER=
MT5_MANAGER_LOGIN=
MT5_MANAGER_PASSWORD=
MT4_SERVER=
MT4_MANAGER_LOGIN=
MT4_MANAGER_PASSWORD=
```

After the first successful deploy, copy the Railway public API URL, for example:

```txt
https://pipnest-api.up.railway.app/api
```

## Vercel Frontend

Create a Vercel project from the same repo and set:

- Root Directory: `apps/web`
- Framework: Next.js
- Enable: Include source files outside of the Root Directory in the Build Step

The `apps/web/vercel.json` file will run install/build from the monorepo root so the shared workspace builds correctly.

Set this Vercel variable:

```env
NEXT_PUBLIC_API_URL=https://your-railway-api-domain.up.railway.app/api
```

After Vercel gives you the frontend URL, put that URL back into Railway as `NEXT_PUBLIC_APP_URL` and `CORS_ORIGINS`, then redeploy the Railway service.

## Later VPS Move

When the API moves from Railway to Hostinger VPS, keep Vercel as-is and only change:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

Then point the VPS API CORS variables at the same Vercel/custom frontend domain:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Railway may block or fail outbound SMTP connections to Gmail. The recommended production setup is an HTTPS email provider:

```env
RESEND_API_KEY=re_...
RESEND_FROM=PipNest Markets <support@yourdomain.com>
```

Verify your sending domain in Resend before using `RESEND_FROM`. If `RESEND_API_KEY` is set, the API sends email through Resend over HTTPS and skips SMTP. If you still use Gmail SMTP, use a Google App Password with 2-Step Verification enabled and paste the 16-character app password without spaces, for example `abcdabcdabcdabcd`.

User-uploaded avatars are uploaded server-side to Cloudinary when these Railway variables are set:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

The app stores uploads in the default `pipnest` Cloudinary folder automatically; you do not need a separate folder credential. Do not commit the Cloudinary API secret. If the secret was shared in chat or logs, rotate it in the Cloudinary dashboard before production use.
