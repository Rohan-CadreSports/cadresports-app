# Security Policy - Cadre Sport

**This file must be consulted before every build and feature implementation.**

## Core Principles

1. **Never trust client-side validation alone** — always validate server-side
2. **Every mutation must verify ownership** — operator can only modify their own leagues
3. **Role checks are necessary but not sufficient** — always verify resource ownership
4. **Defense in depth** — multiple layers of protection at every boundary

## Authentication Security

### Current Implementation
- NextAuth v5 with JWT strategy
- Providers: Email/Password (bcrypt hashed), Google OAuth, Phone OTP (dummy — MUST replace before production)
- Session stored in JWT, verified on every request via middleware
- NEXTAUTH_SECRET must be a strong random string (min 32 chars) in production

### Production Checklist
- [ ] Replace dummy phone OTP with real provider (Twilio, MSG91, etc.)
- [ ] Set strong NEXTAUTH_SECRET (use `openssl rand -base64 32`)
- [ ] Enable HTTPS only (set NEXTAUTH_URL to https://)
- [ ] Set secure cookie options in NextAuth config
- [ ] Implement rate limiting on auth endpoints
- [ ] Add account lockout after 5 failed login attempts
- [ ] Add email verification flow for email/password signups
- [ ] Implement password strength requirements (min 8 chars, mixed case, number)

## Authorization Model

### Role Hierarchy
```
SUPER_ADMIN > FEDERATION_ADMIN > TOURNAMENT_OPERATOR > TEAM_CAPTAIN > PLAYER
```

### Ownership Rules (CRITICAL)
Every backend mutation MUST verify:
1. **Role check** — user has minimum required role
2. **Ownership check** — user owns or is assigned to the resource
3. **State check** — resource is in valid state for the operation

Use helpers from `src/lib/trpc/routers/_helpers.ts`:
- `verifyLeagueOwnership(db, leagueId, userId, userRole)`
- `verifyDivisionOwnership(db, divisionId, userId, userRole)`
- `verifyTeamOwnership(db, teamId, userId, userRole)`
- `verifyMatchOwnership(db, matchId, userId, userRole)`

SUPER_ADMIN bypasses ownership checks (by design).

### What Each Role Can Do
| Action | Player | Captain | Operator | Fed Admin | Super Admin |
|--------|--------|---------|----------|-----------|-------------|
| Register for league | Yes | Yes | No | No | No |
| Manage own team roster | No | Own team | Assigned leagues | No | All |
| Manage registrations | No | No | Assigned leagues | View only | All |
| Enter scores | No | No | Assigned leagues | No | All |
| Create leagues | No | No | No | No | Yes |
| Assign operators | No | No | No | No | Yes |
| Create operators | No | No | No | No | Yes |

## Input Validation

### Server-Side (tRPC + Zod)
- All inputs validated with Zod schemas
- String lengths: names min 2 max 50, descriptions max 5000
- Numbers: scores validated per sport adapter, IDs validated as CUID
- Enums: status values strictly typed, transitions validated server-side
- JSON data: score data validated through sport-specific adapters

### Client-Side
- HTML5 form validation for immediate feedback
- Disabled buttons during mutation (prevent double submission)
- Loading states on all async operations

## Data Protection

### Sensitive Data
- Passwords: bcrypt hashed with cost factor 12
- Phone numbers: stored with unique constraint, visible only to league operators
- Email addresses: visible only to operators managing registrations
- Player registrations: scoped to league operator only (not public)

### Database Security
- Neon PostgreSQL with SSL required (`sslmode=require`)
- Connection pooling via Neon pooler endpoint
- Direct connection only for migrations (not exposed in app)
- DATABASE_URL never exposed to client (server-only env var)

### API Security
- tRPC endpoints protected by middleware chains (auth -> role -> ownership)
- Public endpoints return minimal data (no emails, phones, etc.)
- Paginated queries with max limits to prevent data dumps

## State Machine Validation

### League Status Transitions (Server-Enforced)
```
DRAFT -> REGISTRATION_OPEN, CANCELLED
REGISTRATION_OPEN -> REGISTRATION_CLOSED, CANCELLED
REGISTRATION_CLOSED -> IN_PROGRESS, REGISTRATION_OPEN
IN_PROGRESS -> COMPLETED
COMPLETED -> (terminal)
CANCELLED -> (terminal)
```

Invalid transitions are rejected server-side with descriptive error messages.

### Match Status
- Only SCHEDULED or LIVE matches can receive scores
- COMPLETED matches cannot be re-scored (prevents tampering)

## Race Condition Prevention

### Standings Updates
- Use atomic `{ increment: value }` operations instead of read-modify-write
- Prevents lost updates when concurrent matches complete simultaneously

### Registration Dedup
- Unique constraint `@@unique([leagueId, playerId])` at database level
- Application-level check before insert as well
- Team membership checked before allowing registration

## Production Hardening Checklist

### Environment
- [ ] All secrets in environment variables (never in code)
- [ ] .env excluded from git (.gitignore)
- [ ] Separate staging and production Neon branches
- [ ] CORS configured to allow only your domain
- [ ] Content Security Policy headers set

### Rate Limiting (TODO)
- [ ] Auth endpoints: 5 requests/minute per IP
- [ ] Registration: 10 requests/minute per user
- [ ] Score submission: 30 requests/minute per user
- [ ] API global: 100 requests/minute per user

### Monitoring (TODO)
- [ ] Failed auth attempt logging
- [ ] Score submission audit trail
- [ ] Role change audit trail
- [ ] Unusual activity alerts (bulk registrations, rapid score changes)

### Infrastructure
- [ ] Vercel deployment with automatic HTTPS
- [ ] Neon auto-scaling enabled
- [ ] Database backups configured
- [ ] Error tracking (Sentry or similar)
- [ ] Uptime monitoring

## Known Limitations (To Fix Before Production)
1. Phone OTP is dummy — accepts any 6-digit code
2. No rate limiting yet
3. No email verification flow
4. No password reset flow
5. No audit logging for admin actions
6. Image URLs not sanitized/proxied
7. No CSRF token in custom forms (NextAuth handles its own)

## Incident Response
If a security issue is discovered:
1. Immediately disable affected feature
2. Rotate all secrets (NEXTAUTH_SECRET, DATABASE_URL)
3. Review audit logs for unauthorized access
4. Notify affected users
5. Patch and deploy fix
6. Post-mortem documentation
