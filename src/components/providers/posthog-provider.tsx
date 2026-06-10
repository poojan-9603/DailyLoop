"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

/**
 * Initializes PostHog if a key is present, otherwise renders children untouched
 * (no-op analytics). Keeps the app fully functional without analytics keys.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  }, [key]);

  if (!key) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
