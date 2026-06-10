"use client";

import posthog from "posthog-js";

// The set of product events tracked across TSA OS (see CLAUDE.md).
export type AnalyticsEvent =
  | "plan_generated"
  | "task_completed"
  | "plan_completed"
  | "smart_log_used"
  | "session_logged"
  | "digest_sent"
  | "digest_opened"
  | "demo_role_switched";

/** Capture a product event. No-ops if PostHog isn't configured. */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, props);
}
