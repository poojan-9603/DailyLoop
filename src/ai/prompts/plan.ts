// PROMPT_VERSION must be bumped whenever the prompt logic changes — stored in DB
// alongside each generated plan so we can correlate quality to version.
export const PROMPT_VERSION = "plan-v1";

export interface PlanContext {
  studentName: string;
  gradeLevel: number;
  todayIso: string; // YYYY-MM-DD
  subjects: Array<{
    id: string;
    name: string;
    // Last-7-day completion stats. Undefined = no history yet.
    completionPct?: number; // 0–100, average task completion rate
    plannedMinutes?: number; // average planned minutes per day
    actualMinutes?: number; // average actual minutes per day (ratio < 1 = slow)
  }>;
}

export function buildPlanPrompt(ctx: PlanContext): string {
  // --- Context block 1: student identity ---
  // Used so the model can address the student by name and calibrate difficulty
  // to grade level (e.g. grade 9 vs grade 12 vocabulary/depth).
  const identity = `Student: ${ctx.studentName}, Grade ${ctx.gradeLevel}. Date: ${ctx.todayIso}.`;

  // --- Context block 2: subject performance stats ---
  // Core signal for weighting. Low completionPct → student struggles with this
  // subject → deserves more time. Low actualMinutes/plannedMinutes ratio → tasks
  // consistently run over or are abandoned → slow subject → front-load it.
  const subjectLines = ctx.subjects
    .map((s) => {
      const parts: string[] = [`- ${s.name} (id: ${s.id})`];
      if (s.completionPct !== undefined)
        parts.push(`completion ${s.completionPct.toFixed(0)}%`);
      if (s.plannedMinutes !== undefined && s.actualMinutes !== undefined) {
        const ratio = s.plannedMinutes > 0 ? s.actualMinutes / s.plannedMinutes : 1;
        parts.push(`actual/planned ratio ${ratio.toFixed(2)}`);
      }
      return parts.join(", ");
    })
    .join("\n");

  // --- Context block 3: output constraints ---
  // Hard rules so the plan is always schedulable in exactly 2 hours.
  const constraints = [
    "Generate a study plan with 3–6 tasks.",
    "The sum of plannedMinutes across ALL tasks MUST be between 105 and 120 (the 2-hour block).",
    "Allocate more time to subjects with low completion % or low actual/planned ratio.",
    "Each task title should be specific and actionable (e.g. 'Practice quadratic equations worksheet 3B', not just 'Math').",
    "Write one concise reason per task explaining the prioritization.",
    "Only use subjectIds from the provided list.",
    "Return JSON matching the schema exactly — no extra fields.",
  ].join("\n");

  return `${identity}

Subjects available with 7-day performance data:
${subjectLines}

Instructions:
${constraints}`;
}
