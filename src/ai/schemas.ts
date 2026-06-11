import { z } from "zod";

// ---------------------------------------------------------------------------
// Plan generation schemas (shared by route handler + client useObject)
// ---------------------------------------------------------------------------

export const PlanTaskSchema = z.object({
  subjectId: z.string().describe("The subject ID from the student's curriculum"),
  subjectName: z.string().describe("Human-readable subject name"),
  title: z.string().describe("Specific, actionable task title (max ~60 chars)"),
  plannedMinutes: z
    .number()
    .int()
    .min(10)
    .max(60)
    .describe("Minutes allocated — 10 min minimum, 60 max"),
  reason: z
    .string()
    .describe("One sentence explaining why this task / subject is prioritized today"),
});

export const PlanOutputSchema = z.object({
  tasks: z
    .array(PlanTaskSchema)
    .min(3)
    .max(6)
    .describe(
      "3–6 tasks whose plannedMinutes sum to 105–120. Weak/slow subjects get more time.",
    ),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export type PlanTask = z.infer<typeof PlanTaskSchema>;
