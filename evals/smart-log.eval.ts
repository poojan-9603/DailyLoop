/**
 * Smart Log eval — 25 messy inputs tested against real prompt + seeded roster.
 * Requires ANTHROPIC_API_KEY and DATABASE_URL.
 * Usage: npm run evals
 */

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { PrismaClient } from "@prisma/client";
import { SmartLogOutputSchema } from "../src/ai/schemas";
import { buildSmartLogPrompt } from "../src/ai/prompts/smartlog";

const db = new PrismaClient();

interface TestCase {
  input: string;
  expectDrill?: string;
  expectMetricType?: string;
  expectNameFragment?: string;
}

const TEST_CASES: TestCase[] = [
  { input: "marcus 40yd 4.92", expectNameFragment: "marcus", expectDrill: "40yd dash", expectMetricType: "TIME" },
  { input: "Marcus Hill 40-yard 4.85 seconds, good form", expectNameFragment: "Marcus", expectMetricType: "TIME" },
  { input: "jordan bench 185 lbs 3x8", expectNameFragment: "jordan", expectMetricType: "WEIGHT" },
  { input: "Jordan Pace bench press 185 x 8", expectNameFragment: "Jordan", expectMetricType: "WEIGHT" },
  { input: "noah sprint 4.9 knee slightly buckling", expectNameFragment: "noah", expectMetricType: "TIME" },
  { input: "mia 1mi run 7:42", expectNameFragment: "mia", expectMetricType: "TIME" },
  { input: "Mia Foster mile 7:45", expectNameFragment: "Mia", expectMetricType: "TIME" },
  { input: "ethan squat 225 4x5", expectNameFragment: "ethan", expectMetricType: "WEIGHT" },
  { input: "Ethan squat 225lbs", expectNameFragment: "Ethan", expectMetricType: "WEIGHT" },
  { input: "lily 100m 12.3 strong finish", expectNameFragment: "lily", expectMetricType: "TIME" },
  { input: "alex deadlift 315 new PR!", expectNameFragment: "alex", expectMetricType: "WEIGHT" },
  { input: "cam 200m 24.8", expectNameFragment: "cam", expectMetricType: "TIME" },
  { input: "ryan hill sprints x10 good form", expectNameFragment: "ryan", expectMetricType: "REPS" },
  { input: "Sofia pull-ups 12", expectNameFragment: "Sofia", expectMetricType: "REPS" },
  { input: "t-rex 40yd 4.75", expectMetricType: "TIME" }, // no match expected
  { input: "hill 40 yard dash 4.88 slight knee drop", expectNameFragment: "hill", expectMetricType: "TIME" },
  { input: "pace bench 195x5", expectNameFragment: "pace", expectMetricType: "WEIGHT" },
  { input: "marcus long jump 18ft 2in", expectNameFragment: "marcus", expectMetricType: "DISTANCE" },
  { input: "Noah 200m dash 25.1 seconds", expectNameFragment: "Noah", expectMetricType: "TIME" },
  { input: "foster mile run 7:50, tired today", expectNameFragment: "foster", expectMetricType: "TIME" },
  { input: "3 sets squat 225 ethan", expectNameFragment: "ethan", expectMetricType: "WEIGHT" },
  { input: "liam 40 4.91", expectNameFragment: "liam", expectMetricType: "TIME" },
  { input: "Liam Torres 40yd 4.88 new PR", expectNameFragment: "Liam", expectMetricType: "TIME" },
  { input: "40 yard dash 4.95 - marcus today", expectNameFragment: "marcus", expectMetricType: "TIME" },
  { input: "bench press: jordan 200lbs, 5 reps", expectNameFragment: "jordan", expectMetricType: "WEIGHT" },
];

interface EvalResult {
  input: string;
  passed: boolean;
  failures: string[];
  output: { studentName?: string; metricType?: string; drill?: string; matchedStudentId?: string | null } | null;
}

async function runEval(
  testCase: TestCase,
  roster: Array<{ id: string; name: string }>,
): Promise<EvalResult> {
  const failures: string[] = [];

  try {
    const { object } = await generateObject({
      model: anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-5"),
      schema: SmartLogOutputSchema,
      prompt: buildSmartLogPrompt({ rawInput: testCase.input, roster }),
    });

    if (testCase.expectNameFragment) {
      const nameMatch = object.studentName.toLowerCase().includes(testCase.expectNameFragment.toLowerCase());
      if (!nameMatch) {
        failures.push(`Name: expected to contain "${testCase.expectNameFragment}", got "${object.studentName}"`);
      }
    }

    if (testCase.expectMetricType && object.metricType !== testCase.expectMetricType) {
      failures.push(`MetricType: expected "${testCase.expectMetricType}", got "${object.metricType}"`);
    }

    if (testCase.expectDrill) {
      const drillMatch =
        object.drill.toLowerCase().includes(testCase.expectDrill.toLowerCase()) ||
        testCase.expectDrill.toLowerCase().includes(object.drill.toLowerCase());
      if (!drillMatch) {
        failures.push(`Drill: expected to match "${testCase.expectDrill}", got "${object.drill}"`);
      }
    }

    if (typeof object.value !== "number" || isNaN(object.value)) {
      failures.push(`Value: expected number, got ${String(object.value)}`);
    }

    return { input: testCase.input, passed: failures.length === 0, failures, output: object };
  } catch (err) {
    return { input: testCase.input, passed: false, failures: [`Exception: ${String(err)}`], output: null };
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required to run evals.");
    process.exit(1);
  }

  // Load roster from DB
  const students = await db.student.findMany({
    include: { user: { select: { name: true } } },
  });
  const roster = students.map((s) => ({ id: s.id, name: s.user.name ?? "Unknown" }));
  console.log(`Loaded roster: ${roster.length} students\n`);

  const results: EvalResult[] = [];
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i]!;
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] "${tc.input.slice(0, 40)}"… `);
    const result = await runEval(tc, roster);
    results.push(result);
    console.log(result.passed ? "✓" : `✗ (${result.failures.join(", ")})`);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const pct = Math.round((passed / total) * 100);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Smart Log Eval: ${passed}/${total} passed (${pct}%)`);
  console.log(pct >= 90 ? "✅ PASS (≥90% target met)" : "❌ FAIL (<90% target)");

  // Write results
  const { writeFileSync } = await import("fs");
  const resultsTable = results
    .map(
      (r) =>
        `| ${r.passed ? "✓" : "✗"} | ${r.input.slice(0, 40).padEnd(40)} | ${r.failures.join("; ") || "—"} |`,
    )
    .join("\n");

  const md = `# Smart Log Eval Results\n\nRun: ${new Date().toISOString()}\n\n**Result: ${passed}/${total} (${pct}%)**\n\n| Pass | Input | Failures |\n|------|-------|----------|\n${resultsTable}\n`;
  writeFileSync("evals/results-smart-log.md", md, "utf-8");
  console.log("Results written to evals/results-smart-log.md");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
