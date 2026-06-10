# TSA OS — Project Specification

## What this is
TSA OS is "the operating system for a student-athlete's day" — a production-grade
internal platform for a K-12 school for serious student-athletes (modeled on Texas
Sports Academy). Students do 2 hours of AI-planned academics in the morning and
athletic training in the afternoon. The product's core thesis: academic data and
athletic data should feed each other.

One daily loop, four roles:
- STUDENT: gets an AI-generated 2-hour study plan each morning, checks off tasks,
  then sees their afternoon training schedule.
- COACH: logs training sessions in seconds via AI "Smart Log", sees athlete progress
  charts and AI insights.
- PARENT: passwordless (magic link in a nightly digest email), read-only view of
  their child's day.
- ADMIN: attention-first dashboard, roster management, integrations.

This is a portfolio project that must look and feel like a real company built it:
real auth, real AI, real background jobs, real error handling, demo mode, seed data.

## Stack (do not deviate without asking)
- Next.js 14+ App Router, TypeScript strict mode, React Server Components where sensible
- Tailwind CSS + shadcn/ui (components copied into repo, restyled minimally)
- tRPC for all internal APIs (with @tanstack/react-query)
- Prisma ORM + Postgres (Supabase). Migrations via `prisma migrate dev`
- Auth.js (NextAuth v5) with Google OAuth + role-based access control built BY HAND
  (no Clerk — auth patterns are deliberately owned in-repo)
- Anthropic Claude API via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`):
  - `streamObject`/`generateObject` with Zod schemas for ALL structured AI outputs
  - model: claude-sonnet-4-20250514 (configurable via env)
- Inngest for background jobs (nightly digest pipeline, insight generation)
- Resend + React Email for the parent digest
- Upstash Redis (`@upstash/ratelimit`) on all AI endpoints
- Sentry + PostHog
- Recharts for charts, cmdk (via shadcn Command) for admin palette
- Zod everywhere: tRPC inputs, AI outputs, webhook payloads, env validation (use @t3-oss/env-nextjs)

Explicitly NOT used: Clerk, Redux, GraphQL, websockets, microservices, Docker.

## Conventions
- `src/` layout. Feature-first folders under `src/features/*` (student, coach, parent,
  admin, ai, digest), shared UI in `src/components`, tRPC routers in `src/server/api/routers`.
- All prompts live in `src/ai/prompts/*.ts` as exported template functions with a
  PROMPT_VERSION constant. Prompts are code: commented, versioned.
- Every AI call: Zod-validated output, one retry on validation failure, then a
  graceful fallback (never a blank screen).
- Every list view has a designed empty state with a next action. Every data fetch has
  a skeleton loader. Every mutation has optimistic update or a pending state + error toast.
- Mobile-first for the coach surface (test at 390px). Parent email must render on mobile.
- Write an AuditLog row for every mutating action (helper: `audit(userId, action, entity, entityId)`).
- Track PostHog events: plan_generated, task_completed, plan_completed, smart_log_used,
  session_logged, digest_sent, digest_opened, demo_role_switched.
- Seed script must produce 3 weeks of REALISTIC data (see Phase 1).
- Never commit secrets. Keep `.env.example` updated.
- After each phase: `npm run typecheck && npm run lint && npm run build` must pass.

## Database schema (Prisma — implement exactly, extend only additively)
See `prisma/schema.prisma` — fully implemented per spec.

## The 5 AI features
1. Adaptive Plan Generator: input = student profile + last 7 days of tasks
   (completion %, planned vs actual minutes per subject). Output = Zod-validated plan
   (3–6 tasks, total 105–120 min, weights weak/slow subjects). Streams to the UI.
2. Smart Log Parser: free text like "marcus 40yd 4.92, slight knee drop on start" →
   {studentId matched against roster (fuzzy name match), drill, metricType, value,
   unit, notes}. Coach confirms before save. Preserve rawInput.
3. Cross-Domain Insight Engine (crown jewel): correlates academic completion with
   athletic metrics per student over 14 days and emits at most one insight, e.g.
   "Marcus's sprint times dip on days study completion is under 60%." Runs in Inngest
   after session logging; also detects plateaus/improvements per drill.
4. Evening Digest Writer: nightly Inngest cron → per student: completion % + today's
   sessions → warm 3-sentence parent digest (one concrete number, one human detail) →
   React Email via Resend, containing the parent magic link. Record emailedAt; tracking
   pixel route sets openedAt.
5. Eval suite: `npm run evals` runs evals/smart-log.eval.ts (25 messy inputs) and
   evals/plan-generator.eval.ts (10 profiles) against the real prompts, printing a
   pass-rate table. Assertions are code (Zod + rules), not AI-graded.

## Auth model
- Google OAuth for STUDENT/COACH/ADMIN. On first login, match email against seeded
  Users; unknown emails get a friendly "ask your admin" screen.
- PARENT: no password ever. Signed, expiring magic-link token (MAGIC_LINK_SECRET,
  7-day expiry) in each digest email → sets a session cookie scoped to read-only
  parent routes.
- Middleware-enforced RBAC: /student/*, /coach/*, /parent/*, /admin/* each require
  their role. tRPC procedures use role-checked middleware too (defense in depth).
- DEMO MODE: /demo presents four "View as" cards; selecting one sets a demo session
  for a seeded demo user (no OAuth). Demo sessions are read-write against demo org
  data only. A small "Demo" badge shows in the navbar.

## Integrations
- Slack: org settings stores an incoming webhook URL; "Send test" button; weekly
  highlights post via Inngest cron.
- Notion: org settings stores token + database id; "Sync curriculum" button pulls
  rows → upserts Subjects. Handle missing/invalid creds gracefully.
- Workable: POST /api/webhooks/workable accepts a candidate_hired payload (Zod-validated,
  shared-secret header) → creates a COACH user. Include scripts/simulate-workable.ts.
