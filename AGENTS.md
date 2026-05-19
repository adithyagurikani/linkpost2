# InkPost — AGENTS.md

## Commands

```bash
npm run dev           # Next.js dev server (port 3000)
npm run build         # production build
npm run lint          # next lint
npm test              # vitest run (single run)
npm run test:watch    # vitest (watch mode)
npm run db:seed       # tsx backend/scripts/seed-mongo.ts
npm run db:cleanup    # tsx backend/scripts/cleanup-posts.ts
```

## Architecture (Decoupled)

### Frontend (Next.js 15, `app/` + `components/` + `lib/`)

- **Pure client-side SPA** — all pages are `"use client"` components. No server components, no NextAuth, no direct MongoDB access.
- **Auth**: JWT-based via `lib/auth-context.tsx` (React context) — access + refresh tokens stored in memory/localStorage.
- **API communication**: `lib/api-client.ts` — fetch-based HTTP client targeting `NEXT_PUBLIC_API_URL` (Express backend). Handles auto-refresh on 401.
- **Route protection**: `ProtectedRoute.tsx` client component wraps pages to redirect unauthenticated users.
- **Forms are all client components** that call the Express backend via `api-client.ts`.
- **Zod schemas** in `lib/validation.ts` for client-side form validation (schemas shared with backend).
- **Shared utilities**: `lib/schedule-utils.ts`, `lib/sources.ts`, `lib/prompts-defaults.ts`.
- **Data fetching**: All pages use `useEffect` + `api.get()` — no SSR data fetching.
- **Timezone detection**: Frontend sends `Intl.DateTimeFormat().resolvedOptions().timeZone` with all scheduling API calls via `detectTimezone()`.

### Backend (Express.js 5, `backend/`)

- **Full REST API** at `http://localhost:3001/api/v1` (or deployed Render URL).
- **Controllers** at `backend/src/controllers/` — thin HTTP handlers.
- **Services** at `backend/src/services/` — all business logic (publish, cron, analytics, auth, LinkedIn OAuth, AI, audit).
- **Middleware**: JWT auth (`authMiddleware`), cron auth (`cronAuthMiddleware`), rate limiting, error handling.
- **Database**: MongoDB via `backend/src/config/db.ts` (MongoClient singleton, global caching pattern).
- **LinkedIn API**: OAuth 2.0 + Community Management `/rest/posts`. Header: `LinkedIn-Version: 202604`, `X-Restli-Protocol-Version: 2.0.0`. Author URN: `urn:li:person:{linkedinUserId}`. OAuth scopes: `openid profile email w_member_social w_member_social_feed`.
- **AI**: OpenCode Free Cloud AI. Endpoint: `https://opencode.ai/zen/v1/chat/completions`. 8 agents (`hashtag`, `refine`, `expand`, `batch`, `prePublish`, `fixPost`, `brief`, `scheduler`) all use free tier models with automatic retry/fallback.
- **Cron**: `backend/src/jobs/cron-scheduler.ts` — three independent `node-cron` tasks:
  1. `*/2 * * * *` — retry failed posts
  2. `*/15 * * * *` — process schedules + post one due + retry
  3. User-configured times — batch optimize tags + analytics cycle
- **Publishing**: `publishPost()` in `backend/src/services/publish.service.ts`. Pipeline: auto-tag injection → pre-publish AI check (fail-closed, up to 2 auto-fix retries via `fixPost` agent) → LinkedIn execute → status/audit updates. On any failure: retryAt set to 2 minutes.
- **Timezone**: Backend accepts `timezone` field in schedule create/update, stores it alongside `times`, converts to UTC for `nextRunAt` via `localToUtc()` in shared schedule-utils.

## LinkedIn Analytics API

- **Engagement fetch (2-tier fallback)** in `backend/src/services/analytics.service.ts`:
  1. `GET /rest/socialMetadata/{postUrn}` — new API, returns `reactionSummaries` + `commentSummary.count`.
  2. `GET /rest/socialActions/{postUrn}` — deprecated fallback, returns `likesSummary.totalLikes` + `commentsSummary.totalComments`.
- **OAuth scopes required**: `w_member_social_feed` (not restricted). With `LinkedIn-Version: 202604`, backward compatibility for `w_member_social` was removed.
- **Manual sync**: POST `{API_URL}/api/v1/system/sync-analytics` or click "Sync Analytics" on dashboard.
- **Cron sync**: `runAnalyticsCycle(30)` runs 3x daily.

## Testing

- **Vitest** with `@vitejs/plugin-react`, jsdom, `@testing-library/react`.
- Config: `vitest.config.ts`. Setup: `tests/setup.ts`.
- **`tests/` is gitignored** — do not commit test files.

## Shared Utilities

- **`lib/schedule-utils.ts`** and **`backend/src/lib/schedule-utils.ts`** — Identical timezone-aware utility functions: `getNextRun(times, after, timezone)`, `localToUtc(dateStr, timezone)`, `getDateInTz(date, timezone)`, `detectTimezone()`, `getTzAbbr(timezone)`. No hardcoded timezone.
- **`lib/sources.ts`** — CSV parser for quoted fields, multi-line values, escape sequences.
- **`lib/validation.ts`** — Zod schemas for client-side form validation (`.max(3000)` for LinkedIn's limit). Includes `timezone` on ScheduleCreate/ScheduleUpdate schemas.
- **`lib/prompts-defaults.ts`** — Static default AI prompt constants.

## Key Conventions

- All pages are `"use client"` with `ProtectedRoute` wrapper.
- Client components call `router.refresh()` after mutations.
- Dates from backend are ISO strings passed directly.
- Status values: `draft`, `scheduled`, `queued`, `posting`, `posted`, `failed`.
- Retry model: max 3 retries, retryAt = 2 min from failure, inline AI fix attempted once on LinkedIn API errors.
- DB config is in `.env` (read by backend). `NEXT_PUBLIC_API_URL` for frontend.
- `@/*` path alias maps to project root.
