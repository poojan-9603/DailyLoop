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

// ---------------------------------------------------------------------------
// Smart Log Parser
// ---------------------------------------------------------------------------

export const SmartLogOutputSchema = z.object({
  matchedStudentId: z.string().nullable().describe("Student ID if confident match, else null"),
  studentName: z.string().describe("Name as extracted from input text"),
  confidence: z.enum(["high", "medium", "low"]).describe("Match confidence against roster"),
  drill: z.string().describe("Drill/exercise name (e.g. '40yd dash', 'bench press')"),
  metricType: z.enum(["TIME", "REPS", "WEIGHT", "DISTANCE"]).describe("Metric category"),
  value: z.number().describe("Numeric measurement value"),
  unit: z.string().describe("Unit of measurement (e.g. 'seconds', 'lbs', 'reps', 'meters')"),
  notes: z.string().optional().describe("Any coaching notes or observations from the input"),
});

export type SmartLogOutput = z.infer<typeof SmartLogOutputSchema>;

// ---------------------------------------------------------------------------
// Digest Writer
// ---------------------------------------------------------------------------

export const DigestOutputSchema = z.object({
  content: z.string().max(300).describe("Warm 3-sentence parent digest"),
});

export type DigestOutput = z.infer<typeof DigestOutputSchema>;

// ---------------------------------------------------------------------------
// Insight Phrasing
// ---------------------------------------------------------------------------

export const InsightPhraseSchema = z.object({
  insight: z.string().max(140).describe("One-sentence coach-facing insight"),
});

export type InsightPhrase = z.infer<typeof InsightPhraseSchema>;
