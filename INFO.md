# CadreSports — Accounts & Services Info

**Owner Email:** rohangurbani77@gmail.com

---

## Services & Accounts

### GitHub
- **Repo:** https://github.com/Rohangurbanii/APPLaunch
- **Account:** Rohangurbanii
- **Email:** gurbanirohan7@gmail.com (git commits)

### Vercel (Hosting)
- **Dashboard:** https://vercel.com/rohangurbani77-9511s-projects
- **Project:** cadresports-app
- **Production URL:** https://cadresports-app.vercel.app
- **Account:** rohangurbani77-9511s-projects

### Neon (Database)
- **Dashboard:** https://console.neon.tech
- **Project:** default
- **Region:** us-east-1
- **Endpoint:** ep-summer-feather-aq3umu7w
- **Database:** neondb
- **Pooler URL:** postgresql://neondb_owner:***@ep-summer-feather-aq3umu7w-pooler.c-8.us-east-1.aws.neon.tech/neondb

### Google OAuth
- **Console:** https://console.cloud.google.com/apis/credentials
- **Client ID:** 678849942435-9t96cthjq4prn6oic8lj6rk8967dk0gr.apps.googleusercontent.com
- **Redirect URIs:**
  - http://localhost:3000/api/auth/callback/google
  - https://cadresports-app.vercel.app/api/auth/callback/google

### Resend (Email Service)
- **Dashboard:** https://resend.com
- **Account:** rohangurbani77@gmail.com
- **API Key:** re_NkWayMQC_... (configured)
- **Used for:** Password reset, email verification, notifications

### Twilio / MSG91 (Phone OTP)
- **Status:** Not yet configured
- **Used for:** Real phone OTP verification

---

## Environment Variables

### Local (.env)
```
DATABASE_URL=postgresql://...@ep-summer-feather-aq3umu7w-pooler...
DIRECT_DATABASE_URL=postgresql://...@ep-summer-feather-aq3umu7w...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-to-a-random-secret-in-production
GOOGLE_CLIENT_ID=678849942435-9t96cthjq4prn6oic8lj6rk8967dk0gr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
RESEND_API_KEY=(to be added)
```

### Vercel (Production)
```
DATABASE_URL ✓
NEXTAUTH_SECRET ✓
NEXTAUTH_URL ✓
AUTH_TRUST_HOST ✓
GOOGLE_CLIENT_ID ✓
GOOGLE_CLIENT_SECRET ✓
RESEND_API_KEY ✓
```

---

## Tech Stack Versions
- Next.js: 16.2.6
- Prisma: 7.8.0
- NextAuth: 5.0.0-beta.31
- tRPC: 11.17.0
- Node.js: 22.x
- TypeScript: 5.x
- Tailwind CSS: 4.x
- React: 19.2.4
