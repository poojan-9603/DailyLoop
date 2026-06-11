import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { getSessionUser } from "@/server/auth/session";
import { checkAIRateLimit } from "@/ai/ratelimit";
import { SmartLogOutputSchema } from "@/ai/schemas";
import { buildSmartLogPrompt, PROMPT_VERSION } from "@/ai/prompts/smartlog";
import { db } from "@/server/db";
import { env } from "@/env";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkAIRateLimit(user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json()) as { rawInput: string };
  if (!body.rawInput?.trim()) {
    return NextResponse.json({ error: "rawInput required" }, { status: 400 });
  }

  // Load roster for AI name matching
  const coach = await db.coach.findUnique({
    where: { userId: user.id },
    include: { user: { select: { orgId: true } } },
  });
  const roster = coach
    ? await db.student.findMany({
        where: { user: { orgId: coach.user.orgId } },
        include: { user: { select: { name: true } } },
      }).then((ss) => ss.map((s) => ({ id: s.id, name: s.user.name ?? "Unknown" })))
    : [];

  try {
    const { object } = await generateObject({
      model: anthropic(env.AI_MODEL),
      schema: SmartLogOutputSchema,
      prompt: buildSmartLogPrompt({ rawInput: body.rawInput, roster }),
    });

    return NextResponse.json(object, {
      headers: { "x-prompt-version": PROMPT_VERSION },
    });
  } catch {
    // Retry once
    try {
      const { object } = await generateObject({
        model: anthropic(env.AI_MODEL),
        schema: SmartLogOutputSchema,
        prompt: buildSmartLogPrompt({ rawInput: body.rawInput, roster }),
      });
      return NextResponse.json(object, { headers: { "x-prompt-version": PROMPT_VERSION } });
    } catch (err2) {
      return NextResponse.json({ error: "AI parse failed", details: String(err2) }, { status: 500 });
    }
  }
}
