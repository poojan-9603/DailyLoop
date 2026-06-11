/**
 * Plan Generator eval — 10 synthetic student profiles.
 * Assertions: schema valid, total 105-120 min, 3-6 tasks, weak subjects weighted.
 * Requires ANTHROPIC_API_KEY.
 * Usage: npm run evals
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { PlanOutputSchema } from "../src/ai/schemas";
import { buildPlanPrompt, type PlanContext } from "../src/ai/prompts/plan";

const TODAY = new Date().toISOString().split("T")[0]!;

interface Profile {
  label: string;
  ctx: PlanContext;
  weakSubject?: string;
}

function sub(id: string, name: string, pct: number, ratio: number) {
  return { id, name, completionPct: pct, plannedMinutes: 30, actualMinutes: Math.round(30 * ratio) };
}

const PROFILES: Profile[] = [
  {
    label: "Strong overall student",
    ctx: { studentName: "Alex", gradeLevel: 10, todayIso: TODAY, subjects: [sub("math","Math",90,0.95), sub("eng","English",85,1.0), sub("sci","Science",88,0.98)] },
  },
  {
    label: "Weak in Math",
    weakSubject: "Math",
    ctx: { studentName: "Jamie", gradeLevel: 9, todayIso: TODAY, subjects: [sub("math","Math",40,1.5), sub("eng","English",85,0.9), sub("hist","History",80,1.0)] },
  },
  {
    label: "Weak in Science, slow",
    weakSubject: "Science",
    ctx: { studentName: "Morgan", gradeLevel: 11, todayIso: TODAY, subjects: [sub("math","Math",75,1.0), sub("sci","Science",35,2.0), sub("eng","English",90,0.85)] },
  },
  {
    label: "All subjects struggling",
    ctx: { studentName: "Taylor", gradeLevel: 10, todayIso: TODAY, subjects: [sub("math","Math",45,1.4), sub("eng","English",50,1.3), sub("sci","Science",42,1.5)] },
  },
  {
    label: "High achiever, 4 subjects",
    ctx: { studentName: "Riley", gradeLevel: 12, todayIso: TODAY, subjects: [sub("math","Math",95,0.9), sub("eng","English",92,0.88), sub("sci","Science",90,0.92), sub("hist","History",88,0.95)] },
  },
  {
    label: "New student, no history",
    ctx: { studentName: "Casey", gradeLevel: 9, todayIso: TODAY, subjects: [{ id: "math", name: "Math" }, { id: "eng", name: "English" }] },
  },
  {
    label: "Weak History, strong rest",
    weakSubject: "History",
    ctx: { studentName: "Jordan", gradeLevel: 11, todayIso: TODAY, subjects: [sub("math","Math",88,0.95), sub("hist","History",30,1.8), sub("eng","English",85,0.9), sub("sci","Science",82,1.0)] },
  },
  {
    label: "5 subjects, mixed performance",
    ctx: { studentName: "Sam", gradeLevel: 10, todayIso: TODAY, subjects: [sub("math","Math",70,1.1), sub("eng","English",80,1.0), sub("sci","Science",65,1.2), sub("hist","History",75,1.0), sub("art","Art",90,0.9)] },
  },
  {
    label: "Only 2 subjects",
    ctx: { studentName: "Dana", gradeLevel: 8, todayIso: TODAY, subjects: [sub("math","Math",60,1.2), sub("eng","English",70,1.0)] },
  },
  {
    label: "Perfect week prior",
    ctx: { studentName: "Quinn", gradeLevel: 12, todayIso: TODAY, subjects: [sub("math","Math",100,0.85), sub("eng","English",100,0.88), sub("sci","Science",100,0.9)] },
  },
];

interface EvalResult {
  label: string;
  passed: boolean;
  failures: string[];
  totalMinutes?: number;
  taskCount?: number;
}

async function runEval(profile: Profile): Promise<EvalResult> {
  const failures: string[] = [];

  try {
    const { object } = await generateObject({
      model: anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-5"),
      schema: PlanOutputSchema,
      prompt: buildPlanPrompt(profile.ctx),
    });

    // Rule 1: 3–6 tasks
    if (object.tasks.length < 3 || object.tasks.length > 6) {
      failures.push(`Task count ${object.tasks.length} not in [3,6]`);
    }

    // Rule 2: total 105–120 minutes
    const total = object.tasks.reduce((s, t) => s + t.plannedMinutes, 0);
    if (total < 105 || total > 120) {
      failures.push(`Total ${total} min not in [105,120]`);
    }

    // Rule 3: weak subject gets more time (if specified)
    if (profile.weakSubject) {
      const weakTask = object.tasks.find((t) =>
        t.subjectName.toLowerCase().includes(profile.weakSubject!.toLowerCase()),
      );
      if (!weakTask) {
        failures.push(`Weak subject "${profile.weakSubject}" not included in plan`);
      } else {
        const avgMinutes = total / object.tasks.length;
        if (weakTask.plannedMinutes < avgMinutes * 0.9) {
          failures.push(
            `Weak subject "${profile.weakSubject}" got ${weakTask.plannedMinutes}min < avg ${Math.round(avgMinutes)}min`,
          );
        }
      }
    }

    // Rule 4: all tasks have reason strings
    const noReason = object.tasks.filter((t) => !t.reason?.trim());
    if (noReason.length > 0) {
      failures.push(`${noReason.length} tasks missing reason`);
    }

    return { label: profile.label, passed: failures.length === 0, failures, totalMinutes: total, taskCount: object.tasks.length };
  } catch (err) {
    return { label: profile.label, passed: false, failures: [`Exception: ${String(err)}`] };
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const results: EvalResult[] = [];

  for (let i = 0; i < PROFILES.length; i++) {
    const profile = PROFILES[i]!;
    process.stdout.write(`[${i + 1}/${PROFILES.length}] ${profile.label}… `);
    const result = await runEval(profile);
    results.push(result);
    console.log(
      result.passed
        ? `✓ (${result.taskCount} tasks, ${result.totalMinutes}min)`
        : `✗ (${result.failures.join(", ")})`,
    );
    await new Promise((r) => setTimeout(r, 600));
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const pct = Math.round((passed / total) * 100);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Plan Generator Eval: ${passed}/${total} passed (${pct}%)`);
  console.log(pct >= 90 ? "✅ PASS (≥90% target met)" : "❌ FAIL (<90% target)");

  const { writeFileSync } = await import("fs");
  const rows = results.map(
    (r) =>
      `| ${r.passed ? "✓" : "✗"} | ${r.label} | ${r.totalMinutes ?? "—"} | ${r.taskCount ?? "—"} | ${r.failures.join("; ") || "—"} |`,
  ).join("\n");

  const md = `# Plan Generator Eval Results\n\nRun: ${new Date().toISOString()}\n\n**Result: ${passed}/${total} (${pct}%)**\n\n| Pass | Profile | Total Min | Tasks | Failures |\n|------|---------|-----------|-------|----------|\n${rows}\n`;
  writeFileSync("evals/results-plan-generator.md", md, "utf-8");
  console.log("Results written to evals/results-plan-generator.md");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => { /* no db */ });
