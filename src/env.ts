import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment validation for TSA OS.
 *
 * Design choice (Phase 1): only the bare minimum needed to BOOT is required.
 * Everything optional (AI, email, redis, analytics, integrations) is `.optional()`
 * so the app runs cleanly with keys missing — the relevant feature degrades to a
 * no-op / friendly fallback instead of crashing. See CLAUDE.md ("the app must run
 * without optional keys").
 *
 * Set `SKIP_ENV_VALIDATION=1` to skip validation entirely (used for Docker/CI builds
 * where env is injected later).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // --- Required to boot ---
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),

    // --- Optional: auth providers (demo mode works without these) ---
    DIRECT_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    MAGIC_LINK_SECRET: z.string().optional(),

    // --- Optional: AI (Phase 2+) ---
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default("claude-sonnet-4-5"),

    // --- Optional: email (Phase 4) ---
    RESEND_API_KEY: z.string().optional(),

    // --- Optional: background jobs (Phase 3+) ---
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),

    // --- Optional: rate limiting (Phase 2) ---
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // --- Optional: observability ---
    SENTRY_DSN: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    // --- Optional: integrations (Phase 4) ---
    WORKABLE_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    WORKABLE_WEBHOOK_SECRET: process.env.WORKABLE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
