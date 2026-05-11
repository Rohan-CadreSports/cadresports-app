# CadreSports — Ticket Tracker

**Last updated:** 2026-05-11
**Total tickets:** 32
**Fixed:** 0 | **In Progress:** 0 | **Open:** 32

---

## CRITICAL (Ship blockers — app cannot go to real users without these)

### T-001: Replace dummy phone OTP with real provider
- **Status:** OPEN
- **Priority:** CRITICAL
- **Description:** Phone auth accepts ANY 6-digit code. Anyone can login as any phone number.
- **Fix:** Integrate Twilio or MSG91. Store OTP in DB with 5-min expiry. Verify before allowing login.
- **Estimate:** 1 day
- **Files:** `src/lib/auth.ts` (phone credentials provider)

### T-002: Add password reset flow
- **Status:** OPEN
- **Priority:** CRITICAL
- **Description:** If a user forgets their password, there is no way to recover their account. Complete dead end.
- **Fix:** Add /auth/forgot-password page → sends email with reset link → /auth/reset-password?token=xxx → set new password
- **Estimate:** 1.5 days
- **Files:** New pages + new tRPC endpoints + email sending

### T-003: Add email verification on signup
- **Status:** OPEN
- **Priority:** CRITICAL
- **Description:** Anyone can register with any email. No verification that they own it. Could impersonate others.
- **Fix:** On register, send verification email with link. Mark emailVerified only after clicking. Block login until verified.
- **Estimate:** 1 day
- **Files:** `src/lib/trpc/routers/auth.ts`, new verification page

### T-004: Database backups
- **Status:** OPEN
- **Priority:** CRITICAL
- **Description:** Zero backups configured. If Neon has an issue or data gets corrupted, everything is lost.
- **Fix:** Enable Neon's point-in-time recovery. Set up daily logical backups. Test restore process.
- **Estimate:** 0.5 days
- **Files:** Neon dashboard config, no code changes

### T-005: Staging environment
- **Status:** OPEN
- **Priority:** CRITICAL
- **Description:** All changes deploy directly to production. No way to test before real users see it.
- **Fix:** Create Neon branch for staging DB. Create Vercel preview environment. Test on staging before promoting to prod.
- **Estimate:** 0.5 days
- **Files:** Vercel config, Neon branching

---

## HIGH (Major gaps — users will hit these in first week)

### T-006: Zero automated tests
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** No unit tests, no integration tests, no E2E tests. Any code change can silently break features.
- **Fix:** Add Vitest for unit tests (scoring logic, fixture generator, points calculation). Add Playwright for E2E (registration → scoring flow).
- **Estimate:** 3 days
- **Files:** New test files throughout

### T-007: Audit logging for score changes
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** When TO enters/edits a score, there's no record of who changed what and when. Critical for disputes.
- **Fix:** Create AuditLog table. Log every score entry, edit, walkover with userId, timestamp, before/after data.
- **Estimate:** 1 day
- **Files:** New Prisma model, `src/lib/trpc/routers/match.ts`

### T-008: Standings full rebuild endpoint
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** If standings data gets corrupted (race condition, manual DB edit), no way to recalculate from scratch. Only incremental updates exist.
- **Fix:** Add admin endpoint that recalculates all standings for a division from match scores. Zero out and rebuild.
- **Estimate:** 0.5 days
- **Files:** `src/lib/trpc/routers/match.ts`

### T-009: Global error boundary
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** When a page crashes, users see a white screen or cryptic error. No friendly message, no recovery.
- **Fix:** Add Next.js error.tsx at root and per-route. Show "Something went wrong" with retry button. Log errors to monitoring service.
- **Estimate:** 0.5 days
- **Files:** `src/app/error.tsx`, per-route error files

### T-010: Search leagues by name
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** Users can only browse leagues by city. No way to search "Mumbai Badminton" or find a specific league.
- **Fix:** Add search input on /leagues page. tRPC query with name contains filter.
- **Estimate:** 0.5 days
- **Files:** `src/app/leagues/page.tsx`, `src/lib/trpc/routers/league.ts`

### T-011: Filter leagues by sport
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** Can't filter league list to show only badminton or only football leagues.
- **Fix:** Add sport filter pills/tabs on /leagues page.
- **Estimate:** 0.5 days
- **Files:** `src/app/leagues/page.tsx`

### T-012: Match scheduling (date/time/venue per tie)
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** TO generates fixtures but can't set when/where each match happens. Players don't know schedule.
- **Fix:** Add date picker + venue field per tie in operator matches page. Show in player's my-matches.
- **Estimate:** 1 day
- **Files:** Operator matches page, tRPC match router

### T-013: Notifications system (minimum email)
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** Zero notifications. Players don't know when they're approved, when matches are scheduled, or when scores are posted.
- **Fix:** Phase 1: Email notifications via Resend/SendGrid for registration approval, upcoming match, score posted. Phase 2: WhatsApp API.
- **Estimate:** 2 days
- **Files:** New notification service, hooks in registration/match routers

### T-014: Admin override for locked scores
- **Status:** OPEN
- **Priority:** HIGH
- **Description:** After 1 edit, scores are locked forever. Only changeable via direct DB access. Super Admin needs UI to override.
- **Fix:** Add Super Admin score override endpoint that bypasses edit count check. Add UI button visible only to admin.
- **Estimate:** 0.5 days
- **Files:** `src/lib/trpc/routers/match.ts`, operator matches page

---

## MEDIUM (Important for polish — users will notice but won't leave over it)

### T-015: Friendly error messages
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Many errors show raw tRPC messages like "BAD_REQUEST: Registration deadline has passed". Should be user-friendly.
- **Fix:** Map common error codes to friendly messages in a central error handler. Show actionable messages.
- **Estimate:** 0.5 days
- **Files:** Frontend error handling throughout

### T-016: Player profiles (public)
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Clicking a player name anywhere shows nothing. No player profile page exists.
- **Fix:** Create /players/[id] page showing name, city, leagues participated, basic stats. Privacy-respecting (no email/phone).
- **Estimate:** 1 day
- **Files:** New page, new tRPC endpoint

### T-017: Social sharing
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Can't share a league, result, or leaderboard on WhatsApp/social media.
- **Fix:** Add share buttons on league detail, standings, results pages. Generate OG meta tags for rich previews.
- **Estimate:** 1 day
- **Files:** League pages, layout metadata

### T-018: Real-time score updates
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Scores only update on page refresh. No live updates during active matches.
- **Fix:** Phase 1: Auto-refresh every 30s for IN_PROGRESS leagues. Phase 2: WebSocket/SSE for instant updates.
- **Estimate:** 0.5 days (Phase 1), 2 days (Phase 2)
- **Files:** Client components with polling/WebSocket

### T-019: Admin analytics dashboard
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Admin sees basic counts (users, leagues) but no trends, charts, or exportable reports.
- **Fix:** Add charts (registrations over time, popular sports, city distribution). Use Recharts or Chart.js.
- **Estimate:** 2 days
- **Files:** New admin analytics page

### T-020: Load testing
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Claims 10K user support but zero load testing done. Unknown breaking point.
- **Fix:** Run k6 or Artillery against staging. Test concurrent score submissions, registration spikes, leaderboard queries.
- **Estimate:** 1 day
- **Files:** New test scripts (not in codebase)

### T-021: Redis caching for hot data
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Standings, league lists, and sport lists hit DB on every request. Under load this will be slow.
- **Fix:** Add Upstash Redis. Cache standings (invalidate on score entry), cache sport list (rarely changes).
- **Estimate:** 1 day
- **Files:** New cache layer, `src/lib/db.ts`

### T-022: Knockout bracket generation + seeding UI
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Knockout format code exists in fixture-generator but no UI for TO to seed teams or view bracket visually.
- **Fix:** Add bracket visualization component. Add seeding UI where TO assigns seed 1-4. Generate bracket with byes.
- **Estimate:** 2 days
- **Files:** New bracket component, operator matches page

### T-023: Hybrid format implementation
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Hybrid (RR → Knockout) is defined in code but the transition from RR to knockout phase has no UI/trigger.
- **Fix:** After RR rounds complete, TO clicks "Start Knockout Phase" → system takes top N teams → generates bracket.
- **Estimate:** 1.5 days
- **Files:** `src/lib/trpc/routers/league.ts`, operator matches page

### T-024: Rate limiting
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** No rate limiting on any endpoint. A bot could spam registrations, score submissions, or auth attempts.
- **Fix:** Add Upstash Ratelimit. Limit auth: 5/min, registration: 10/min, score: 30/min, global: 100/min per user.
- **Estimate:** 0.5 days
- **Files:** Middleware or tRPC middleware

### T-025: TO onboarding / help guide
- **Status:** OPEN
- **Priority:** MEDIUM
- **Description:** Tournament Operator flow is complex (registrations → teams → fixtures → lineups → scores). No guidance or tooltips.
- **Fix:** Add a first-time TO walkthrough or help tooltips on the operator dashboard explaining each step.
- **Estimate:** 1 day
- **Files:** Operator pages

---

## LOW (Nice to have — won't affect launch but improves experience)

### T-026: Dark mode
- **Status:** OPEN
- **Priority:** LOW
- **Description:** App is light-mode only. Many users prefer dark mode, especially for evening use.
- **Fix:** Add CSS variables for dark theme. Toggle in navbar. Respect system preference.
- **Estimate:** 1 day
- **Files:** `globals.css`, layout

### T-027: PWA install prompt
- **Status:** OPEN
- **Priority:** LOW
- **Description:** manifest.json exists but no install prompt or service worker. App can't be "installed" on phone home screen.
- **Fix:** Add service worker, install banner, offline fallback page.
- **Estimate:** 1 day
- **Files:** `public/sw.js`, manifest, layout

### T-028: Export data (CSV/PDF)
- **Status:** OPEN
- **Priority:** LOW
- **Description:** No way to export standings, results, or player lists. TOs need this for printing/sharing.
- **Fix:** Add "Export" button on standings and registrations pages. Generate CSV or PDF.
- **Estimate:** 1 day
- **Files:** New export utilities, UI buttons

### T-029: Multi-language support
- **Status:** OPEN
- **Priority:** LOW
- **Description:** App is English only. India has many languages. Hindi at minimum would expand reach.
- **Fix:** Add next-intl or similar i18n library. Extract all strings. Add Hindi translations.
- **Estimate:** 3 days
- **Files:** All pages (string extraction)

### T-030: Accessibility (a11y) audit
- **Status:** OPEN
- **Priority:** LOW
- **Description:** No accessibility audit done. Screen readers, keyboard navigation, color contrast may have issues.
- **Fix:** Run axe-core audit. Fix ARIA labels, focus management, contrast ratios.
- **Estimate:** 1 day
- **Files:** Throughout

### T-031: Image uploads (team logos, player avatars)
- **Status:** OPEN
- **Priority:** LOW
- **Description:** No image upload anywhere. Teams have no logos, players have no custom avatars.
- **Fix:** Add Cloudflare R2 or S3 upload. Allow team logo upload by TO, profile photo by player.
- **Estimate:** 1.5 days
- **Files:** New upload API, profile page, team management

### T-032: Connect feature (find players)
- **Status:** OPEN
- **Priority:** LOW
- **Description:** "Coming Soon" page exists but no actual functionality. Core future feature.
- **Fix:** Player discovery by city + sport + skill level. Availability calendar. Chat/contact request.
- **Estimate:** 5-7 days
- **Files:** Entirely new feature module

---

## Completed Tickets

| Ticket | Description | Completed | Notes |
|--------|-------------|-----------|-------|
| — | None yet | — | — |

---

## Sprint Planning Suggestion

### Week 1 (Ship Blockers)
- T-001: Real phone OTP
- T-002: Password reset
- T-003: Email verification
- T-004: Database backups
- T-005: Staging environment
- T-009: Global error boundary

### Week 2 (Core Gaps)
- T-006: Automated tests (start)
- T-007: Audit logging
- T-008: Standings rebuild
- T-010: Search leagues
- T-011: Sport filter
- T-012: Match scheduling

### Week 3 (User Experience)
- T-013: Email notifications
- T-014: Admin score override
- T-015: Friendly errors
- T-022: Knockout bracket UI
- T-025: TO help guide

### Week 4 (Scale & Polish)
- T-020: Load testing
- T-021: Redis caching
- T-024: Rate limiting
- T-017: Social sharing
- T-018: Real-time updates (Phase 1)
