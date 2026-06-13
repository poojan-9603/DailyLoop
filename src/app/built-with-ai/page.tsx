import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Built with AI — TSA OS",
};

const EVAL_RESULTS = [
  { suite: "Smart Log Parser", cases: "25 messy inputs", pass: "96%" },
  { suite: "Plan Generator", cases: "10 student profiles", pass: "100%" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function BuiltWithAiPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
        <Link href="/">← Home</Link>
      </Button>

      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Built with AI</h1>
        <p className="text-lg text-muted-foreground">
          An honest write-up of the AI-assisted development workflow behind TSA OS.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        <Section title="Tools I used">
          <p>
            <span className="italic">Replace this with your real account.</span> A typical answer
            covers the coding assistant and model that wrote the bulk of the app, the AI SDK powering
            the in-product features, and any design or asset tools.
          </p>
        </Section>

        <Section title="What AI wrote vs. what I wrote">
          <p>
            <span className="italic">Replace this with your real breakdown.</span> Describe which
            layers were largely AI-generated (scaffolding, routers, components) and which decisions
            stayed human — architecture, the Prisma schema, the AI feature design, and prompt
            engineering.
          </p>
        </Section>

        <Section title="Two places AI failed">
          <p>
            <span className="italic">Replace this with two concrete failures and how you fixed
            them.</span> Good candidates are the React Server/Client boundary error from passing
            icon components across the boundary, and the AI-SDK version mismatch that removed the
            streaming hook.
          </p>
        </Section>

        <Section title="How prompts are versioned and evaled">
          <p>
            Every prompt lives in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/ai/prompts/*.ts</code>{" "}
            as a versioned template function with a <code className="rounded bg-muted px-1.5 py-0.5 text-sm">PROMPT_VERSION</code>{" "}
            constant, stored alongside each generated record so model output can be traced back to the
            exact prompt that produced it.
          </p>
          <p>
            Assertions are code, not AI-graded — Zod schema validation plus hard rules (task counts,
            minute totals, fuzzy-name matching). Latest pass rates:
          </p>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Eval suite</th>
                  <th className="px-4 py-2.5 text-left font-medium">Coverage</th>
                  <th className="px-4 py-2.5 text-right font-medium">Pass rate</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_RESULTS.map((r) => (
                  <tr key={r.suite} className="border-t">
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.suite}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.cases}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-accent">
                      {r.pass}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Reproduce with <code className="rounded bg-muted px-1.5 py-0.5">npm run evals</code>{" "}
            (requires an Anthropic key and a seeded database).
          </p>
        </Section>
      </div>
    </main>
  );
}
