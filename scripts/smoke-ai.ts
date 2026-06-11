/**
 * smoke-ai.ts — quick sanity check that the Anthropic key + Vercel AI SDK work.
 * Run: npx tsx --env-file=.env.local scripts/smoke-ai.ts
 * Keep this as a utility; do not delete.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const PingSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set — export it or use --env-file=.env.local");
    process.exit(1);
  }

  console.log("Calling claude via Vercel AI SDK (generateObject)…");
  const { object } = await generateObject({
    model: anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-20250514"),
    schema: PingSchema,
    prompt: 'Reply with { "ok": true, "message": "TSA OS AI is live" }',
  });

  console.log("Response:", object);
  if (!object.ok) throw new Error("Unexpected response: ok !== true");
  console.log("✓ Smoke test passed");
}

main().catch((err) => {
  console.error("✗ Smoke test FAILED:", err.message ?? err);
  process.exit(1);
});
