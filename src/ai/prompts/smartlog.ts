export const PROMPT_VERSION = "smartlog-v1";

export interface SmartLogContext {
  rawInput: string;
  roster: Array<{ id: string; name: string }>;
}

export function buildSmartLogPrompt(ctx: SmartLogContext): string {
  const rosterList = ctx.roster.map((s) => `- ${s.name} (id: ${s.id})`).join("\n");

  return `You are a sports training assistant. Parse the coach's log entry and extract structured data.

ROSTER (use fuzzy name matching — handle nicknames, partials, last-name only):
${rosterList}

LOG ENTRY:
"${ctx.rawInput}"

Instructions:
- Match the athlete name to the roster. If confident (full name or unique partial), set matchedStudentId.
- If ambiguous or not found, set matchedStudentId to null and confidence to "low".
- Identify the drill/exercise (normalize common aliases: "40" → "40yd dash", "bench" → "bench press").
- Determine metricType: TIME (seconds/minutes), REPS (count), WEIGHT (lbs/kg), DISTANCE (meters/yards/miles).
- Extract the numeric value and unit.
- Extract any coaching notes (form cues, observations) into notes.
- Return JSON matching the schema exactly.`;
}
