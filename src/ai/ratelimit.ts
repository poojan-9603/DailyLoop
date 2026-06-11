import { env } from "@/env";

// Lazily constructed — only instantiated when Upstash keys are present.
let limiter: import("@upstash/ratelimit").Ratelimit | null = null;

async function getLimiter() {
  if (limiter) return limiter;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;

  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  limiter = new Ratelimit({
    redis,
    // 10 AI calls per user per hour, sliding window
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "tsa:ai",
  });
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number; // seconds until next allowed request
}

/** Returns { ok: true } when no Upstash keys are set (graceful no-op). */
export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const rl = await getLimiter();
    if (!rl) return { ok: true };
    const { success, reset } = await rl.limit(userId);
    if (success) return { ok: true };
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return { ok: false, retryAfter };
  } catch {
    // Never crash a user-facing request because Redis is down
    return { ok: true };
  }
}
