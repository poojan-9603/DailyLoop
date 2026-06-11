export const PROMPT_VERSION = "digest-v1";

export interface DigestContext {
  studentName: string;
  completionPct: number;
  totalTasks: number;
  completedTasks: number;
  sessions: Array<{
    drill: string;
    value: number;
    unit: string;
    coach: string;
  }>;
  date: string;
}

export function buildDigestPrompt(ctx: DigestContext): string {
  const sessionLines =
    ctx.sessions.length > 0
      ? ctx.sessions.map((s) => `  - ${s.drill}: ${s.value} ${s.unit} (Coach ${s.coach})`).join("\n")
      : "  - No training sessions recorded today";

  return `Write a warm, encouraging 3-sentence parent digest about their child's day at Texas Sports Academy.

Student: ${ctx.studentName}
Date: ${ctx.date}
Academic: Completed ${ctx.completedTasks} of ${ctx.totalTasks} study tasks (${ctx.completionPct}%)
Training:
${sessionLines}

Rules:
- Include at least one concrete number (completion %, a metric value, or session count).
- Include one human/personal detail about effort or progress.
- Warm but professional tone — parent is proud, coach is supportive.
- Maximum 300 characters total across all 3 sentences.
- Do NOT include any HTML or markdown.`;
}
