// Thin wrapper so PostHog tracking calls are always safe (no-op if key missing).
// import posthog from 'posthog-js' would require window — use a simple fetch approach.

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    // @ts-expect-error posthog-js is optional
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    window.posthog?.capture(event, properties);
  } catch {
    // silently ignore
  }
}
