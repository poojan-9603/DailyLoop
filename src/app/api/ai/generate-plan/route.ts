import { streamObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { env } from "@/env";
import { PlanOutputSchema } from "@/ai/schemas";
import { buildPlanPrompt, PROMPT_VERSION } from "@/ai/prompts/plan";
import { checkAIRateLimit } from "@/ai/ratelimit";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";

export const maxDuration = 60;

export async function POST(_req: Request) {
  // --- Auth ---
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "STUDENT") return new Response("Forbidden", { status: 403 });

  // --- Rate limit ---
  const rl = await checkAIRateLimit(user.id);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // --- Load student + context ---
  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, orgId: true } },
    },
  });
  if (!student) return new Response("Student record not found", { status: 404 });

  // Subjects for this grade
  const subjects = await db.subject.findMany({
    where: { orgId: student.user.orgId, gradeLevel: student.gradeLevel },
    select: { id: true, name: true },
  });
  if (subjects.length === 0)
    return new Response("No subjects configured for this grade", { status: 400 });

  // Last 7 days of study plans for performance stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTasks = await db.studyTask.findMany({
    where: {
      plan: {
        studentId: student.id,
        date: { gte: sevenDaysAgo },
      },
    },
    select: {
      subjectId: true,
      plannedMinutes: true,
      actualMinutes: true,
      completed: true,
    },
  });

  // Aggregate per-subject stats
  type SubjectStats = {
    totalTasks: number;
    completedTasks: number;
    totalPlanned: number;
    totalActual: number;
  };
  const statMap = new Map<string, SubjectStats>();
  for (const t of recentTasks) {
    const cur = statMap.get(t.subjectId) ?? {
      totalTasks: 0,
      completedTasks: 0,
      totalPlanned: 0,
      totalActual: 0,
    };
    cur.totalTasks++;
    if (t.completed) cur.completedTasks++;
    cur.totalPlanned += t.plannedMinutes;
    cur.totalActual += t.actualMinutes ?? 0;
    statMap.set(t.subjectId, cur);
  }

  const contextSubjects = subjects.map((s) => {
    const stats = statMap.get(s.id);
    return {
      id: s.id,
      name: s.name,
      completionPct: stats
        ? (stats.completedTasks / stats.totalTasks) * 100
        : undefined,
      plannedMinutes: stats ? stats.totalPlanned / 7 : undefined,
      actualMinutes: stats ? stats.totalActual / 7 : undefined,
    };
  });

  const todayIso = new Date().toISOString().split("T")[0]!;

  const prompt = buildPlanPrompt({
    studentName: student.user.name ?? "Student",
    gradeLevel: student.gradeLevel,
    todayIso,
    subjects: contextSubjects,
  });

  // --- Stream ---
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Attach promptVersion + model + studentId as headers so the client can
  // pass them to the persist mutation.
  const result = streamObject({
    model: anthropic(env.AI_MODEL),
    schema: PlanOutputSchema,
    prompt,
    onFinish: () => {
      // Fire-and-forget: server-side log only (client handles DB persist after stream)
      console.log("[generate-plan] stream finished", {
        userId: user.id,
        promptVersion: PROMPT_VERSION,
      });
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "x-prompt-version": PROMPT_VERSION,
      "x-ai-model": env.AI_MODEL,
      "x-student-id": student.id,
    },
  });
}
