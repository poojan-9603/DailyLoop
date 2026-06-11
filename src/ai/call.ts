import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";
import { env } from "@/env";

export type AISuccess<T> = { success: true; data: T; model: string };
export type AIFailure = { success: false; error: string };
export type AIResult<T> = AISuccess<T> | AIFailure;

/**
 * Wraps generateObject with:
 *  - one automatic retry on validation failure
 *  - a typed failure result instead of thrown errors
 *  - consistent model/version metadata attached to the result
 */
export async function callAI<T>(
  schema: z.ZodType<T>,
  prompt: string,
  opts?: { system?: string },
): Promise<AIResult<T>> {
  if (!env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY not configured" };
  }

  const model = env.AI_MODEL;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { object } = await generateObject({
        model: anthropic(model),
        schema,
        prompt,
        system: opts?.system,
      });
      return { success: true, data: object, model };
    } catch (err) {
      if (attempt === 1) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
      // attempt 0 failed — retry once
    }
  }

  return { success: false, error: "Unknown error" };
}
