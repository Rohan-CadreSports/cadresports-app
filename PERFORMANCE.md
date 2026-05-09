# Performance Policy - Cadre Sport

**This file must be read before every build. Zero tolerance for slow pages or UI hangs.**

## Target Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3s
- **No visible loading spinners** > 2 seconds on any page
- **No layout shifts** after page load
- **Smooth 60fps** scrolling on all pages

## Rules for Every Feature

### Database Queries
- Every Prisma query must use `select` or `include` — never fetch entire models
- Always add `take` limit on list queries (max 50 per page, paginate beyond)
- Add database indexes for any column used in `where`, `orderBy`, or `join`
- Use `_count` instead of loading full arrays just to count them
- Never run N+1 queries — use `include` with nested relations in one query

### Server Components (Default)
- Pages that fetch data should be Server Components (default in App Router)
- Only add `"use client"` when you need interactivity (forms, onClick, useState)
- Server components stream HTML — no JS bundle cost
- Use `loading.tsx` files for instant skeleton loading

### Client Components
- Keep client components small and leaf-level
- Never wrap a large page in `"use client"` — extract interactive parts
- Lazy-load heavy client components with `dynamic(() => import(...), { ssr: false })`
- Debounce search inputs (300ms minimum)
- Use `useTransition` for non-urgent state updates

### Images & Assets
- Always use `next/image` for automatic optimization
- Set explicit `width` and `height` to prevent layout shift
- Use `priority` only for above-the-fold images
- Prefer SVG for icons (already using Lucide — good)

### Data Fetching
- Parallel fetch: use `Promise.all([...])` for independent queries (already doing this)
- Never waterfall: don't `await` query A then use its result to start query B if they're independent
- Cache stable data with React cache or ISR where possible
- Use `force-dynamic` only when data MUST be fresh on every request

### tRPC Client
- Batch requests: `httpBatchLink` is configured (good)
- Don't refetch on window focus for data that doesn't change often
- Use `staleTime` in React Query for data that can be slightly stale
- Invalidate specific queries after mutations, not all queries

### Bundle Size
- Never import entire libraries: `import { X } from "lucide-react"` not `import * as Icons`
- Check imports with `@next/bundle-analyzer` before major releases
- Tree-shake: use named exports, avoid barrel files with side effects
- Keep page JS under 100KB first-load per route

### Lists & Tables
- Paginate any list > 20 items
- Virtualize lists > 100 items (use `@tanstack/react-virtual`)
- Never render 1000+ DOM nodes on a single page
- Standings tables with > 50 teams should paginate

### Loading States
- Every page with DB queries needs a `loading.tsx` sibling for instant skeleton
- Buttons show spinner via `loading` prop during mutations
- Never show a blank white screen while loading
- Skeleton shapes should match final content layout

### Mobile Performance
- Touch targets: minimum 44x44px (already enforced in CSS)
- Font size: minimum 16px on inputs (prevents iOS zoom — already set)
- Reduce motion: respect `prefers-reduced-motion` for animations
- Bottom nav: use `position: fixed` not `sticky` (already doing this)

## Anti-Patterns to Avoid
- Fetching all records then filtering client-side (filter in SQL)
- Using `useEffect` to fetch data that could be a server component
- Re-rendering entire pages when only a small part changes
- Loading full user objects when you only need `id` and `name`
- Storing derived state (calculate from source of truth instead)
- Polling for updates (use webhooks or SSE when real-time is needed)

## Monitoring
- Check Vercel Analytics after every deploy
- Web Vitals tab in Chrome DevTools for local testing
- Lighthouse score target: 90+ on Performance
- Test on throttled 3G network in DevTools before shipping
