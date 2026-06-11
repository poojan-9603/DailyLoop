/**
 * Runs all evals and writes a combined results.md.
 * Usage: npm run evals  (requires ANTHROPIC_API_KEY and DATABASE_URL)
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(1);
}

console.log("=".repeat(60));
console.log("TSA OS Eval Suite");
console.log("=".repeat(60));
console.log();

console.log("Running Smart Log eval (25 cases)…");
console.log("─".repeat(40));
try {
  execSync("npx tsx evals/smart-log.eval.ts", { stdio: "inherit" });
} catch {
  console.error("Smart Log eval encountered errors");
}

console.log();
console.log("Running Plan Generator eval (10 profiles)…");
console.log("─".repeat(40));
try {
  execSync("npx tsx evals/plan-generator.eval.ts", { stdio: "inherit" });
} catch {
  console.error("Plan Generator eval encountered errors");
}

// Combine results
const slMd = existsSync("evals/results-smart-log.md") ? readFileSync("evals/results-smart-log.md", "utf-8") : "Smart Log results not found.";
const pgMd = existsSync("evals/results-plan-generator.md") ? readFileSync("evals/results-plan-generator.md", "utf-8") : "Plan Generator results not found.";

const combined = `# TSA OS Eval Results\n\nGenerated: ${new Date().toISOString()}\n\n---\n\n${slMd}\n\n---\n\n${pgMd}`;
writeFileSync("evals/results.md", combined, "utf-8");
console.log("\n✅ Combined results written to evals/results.md");
