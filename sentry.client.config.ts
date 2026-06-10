import * as Sentry from "@sentry/nextjs";

// No DSN -> Sentry.init is a no-op, so the app runs fine without Sentry configured.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
}
