# CadreSports — Usage Guide

## Project Overview

Next.js 16 monolith for sports league management. Players join leagues, captains submit lineups, Tournament Operators (TOs) enter scores, and Super Admins create/oversee everything.

**Stack:** Next.js 16, React 19, Prisma 7 + Neon (Postgres), tRPC 11, NextAuth v5, Tailwind 4

---

## Local Setup

### Prerequisites

- Node.js 22.x
- npm 10+
- A Neon Postgres database (or any Postgres instance)
- Google OAuth credentials (optional, for Google sign-in)
- Resend API key (optional, for password reset / verification emails)

### Step 1: Clone & Install

```bash
git clone <repo-url>
cd cadresports-app
npm install
```

### Step 2: Set Environment Variables

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# Google OAuth (optional — email/password works without these)
AUTH_GOOGLE_ID=your-client-id
AUTH_GOOGLE_SECRET=your-client-secret

# Resend (optional — for password reset & email verification emails)
RESEND_API_KEY=re_xxxx
```

> `DATABASE_URL` is the pooled connection (used by Prisma via Neon adapter).  
> `DIRECT_DATABASE_URL` is the direct connection (used by Prisma CLI for migrations).

### Step 3: Create Database Tables

The project uses **Prisma Migrate** — tables are NOT auto-created at startup.

Run migrations to create the schema:

```bash
npx prisma generate
npx prisma db push
```

Or for production-style setup:

```bash
npx prisma migrate dev --name init
```

> `prisma db push` syncs the schema directly without migration files.  
> `prisma migrate dev` creates proper migration files (recommended for production).

### Step 4: Seed Sample Data

```bash
npm run db:seed
```

This creates:
- 2 sports (Badminton, Football)
- 1 Super Admin (`admin@cadresport.com` / `admin123`)
- 1 Tournament Operator (`operator@cadresport.com` / `operator123`)
- 8 players (`player1@cadresport.com` through `player8@cadresport.com` / `player123`)
- 1 Federation (Maharashtra Badminton Federation)
- Sample leagues with divisions and teams

### Step 5: Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Database Connection

**File:** `src/lib/db.ts`

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
export const db = new PrismaClient({ adapter });
```

Uses the **Neon serverless adapter** for connection pooling. The `DATABASE_URL` env var should point to the **pooled** Neon URL (ends in `-pooler`).

Prisma Client is generated to `src/generated/prisma/` (gitignored). Regenerate after schema changes:

```bash
npm run db:generate
```

### Schema Changes

After editing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe-change
```

This creates a migration file and applies it to the database.

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Prisma generate + Next build |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to DB (no migration files) |
| `npm run db:migrate` | Create + apply migration |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/trpc/[trpc]/    # tRPC HTTP handler
│   ├── auth/               # Signin, register, forgot/reset password, verify email
│   ├── dashboard/
│   │   ├── admin/          # Super Admin dashboard + create-league/operator/federation
│   │   ├── operator/       # TO dashboard + league management (registrations, teams, matches)
│   │   ├── federation/     # Federation admin view (view-only)
│   │   └── player/         # Player dashboard, matches, lineup submission
│   ├── leagues/            # Public league browsing, detail, standings, matches
│   ├── players/[id]/       # Public player profile
│   ├── sports/             # Sport list
│   ├── connect/            # Future connect feature
│   ├── onboarding/         # Player profile completion
│   ├── page.tsx            # Homepage
│   └── layout.tsx          # Root layout (Navbar, BottomNav, providers)
├── components/
│   ├── ui/                 # Card, Button, Badge, Input, Select, Skeleton
│   ├── layout/             # Navbar, BottomNav
│   └── auth/               # AuthProvider
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # NextAuth config (Google, Credentials, Phone OTP)
│   ├── auth-guard.ts       # Role-based route protection (requireRole, requireAuth)
│   ├── email.ts            # Resend email integration
│   ├── audit.ts            # Audit log helper
│   ├── utils.ts            # cn(), slugify(), formatDate()
│   ├── sport-images.ts     # Unsplash image mapping per sport
│   ├── scoring/            # Sport-specific score validation & display
│   │   ├── types.ts        # ScoreAdapter interface + tie points calculation
│   │   ├── index.ts        # Scorer registry (badminton, football)
│   │   ├── badminton.ts    # 21-pt best-of-3 validation
│   │   └── football.ts     # Goal-based scoring
│   ├── tournament/
│   │   └── fixture-generator.ts  # Round robin + knockout bracket generation
│   └── trpc/
│       ├── server.ts       # tRPC init, context, role middleware
│       ├── client.ts       # tRPC client setup
│       ├── provider.tsx    # React Query + tRPC provider
│       ├── root.ts         # Router aggregation
│       └── routers/
│           ├── auth.ts     # Register, login, profile, onboarding, password reset, email verify
│           ├── admin.ts    # Create TO, create federation, user management, stats
│           ├── league.ts   # CRUD, status transitions, round generation
│           ├── team.ts     # CRUD, player management, lineup submission
│           ├── match.ts    # Score entry, walkover, standings, admin override
│           ├── player.ts   # Public player profile
│           ├── registration.ts  # Player registration, approval, team assignment
│           └── sport.ts    # Sport CRUD
├── middleware.ts           # Route protection for /dashboard and /profile
```

---

## Architecture Decisions

- **DB schema** uses Prisma with Postgres (Neon). 13 models: User, Account, Session, VerificationToken, Sport, Federation, FederationAdmin, League, Division, Team, TeamPlayer, PlayerRegistration, Tie, Match, MatchScore, Lineup, LineupEntry, Standing, AuditLog.
- **Auth** uses NextAuth v5 with JWT strategy. Three providers: Google OAuth, Email+Password, Phone OTP.
- **API** uses tRPC — all backend logic is in `src/lib/trpc/routers/`. No REST endpoints (except the tRPC HTTP handler).
- **Role hierarchy:** PLAYER (0) < TEAM_CAPTAIN (0) < TOURNAMENT_OPERATOR (2) < FEDERATION_ADMIN (3) < SUPER_ADMIN (4).
- **Scoring** is sport-agnostic via a `ScoreAdapter` interface. Add a new sport by implementing validateScore/determineWinner/getDisplayScore.
- **Fixture generation** happens round-by-round (not all upfront). TO clicks "Generate Next Round" after each round completes.
