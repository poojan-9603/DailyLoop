import { withSentryConfig } from "@sentry/nextjs";

// env validation runs at runtime via `src/env.ts`, which is imported by app code
// (e.g. the tRPC context and auth config) and throws on missing required vars.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

// Sentry wraps the config but is a no-op for sourcemap upload when no auth token
// / DSN is present, so the app still builds without Sentry credentials.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  // Only upload sourcemaps when a Sentry auth token is configured.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
