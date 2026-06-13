import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Built with AI — TSA OS",
};

const EVAL_RESULTS = [
  { eval: "Smart Log parser — 25 messy, real-world coach inputs", pass: "96%" },
  { eval: "Study plan generator — 10 student profiles", pass: "100%" },
];

export default function BuiltWithAiPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Button asChild variant="ghost" size="sm" className="mb-10 -ml-2">
        <Link href="/">← Home</Link>
      </Button>

      <article className="text-[16px] leading-[1.75] text-muted-foreground">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Built with AI</h1>

        <p className="mt-6">
          I&apos;ll be honest about how this was built, because for a role like this the process
          matters as much as the result.
        </p>
        <p className="mt-4">
          AI was in the loop the whole way through. But I want to be precise about what that means:
          the AI did a lot of the typing, and I made all of the decisions. The difference is the
          entire point.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground">How I worked</h2>
        <p className="mt-4">
          I used Claude in two modes. One was a thinking partner — scoping the product, arguing
          through architecture, pressure-testing what to build and what to cut. The other was Claude
          Code, generating implementation against specs I wrote.
        </p>
        <p className="mt-4">
          The thing that made this work was treating a single spec file as the contract. Schema,
          conventions, constraints, the things I&apos;d decided not to do — all of it lived in one
          place the AI read at the start of every session. That&apos;s what kept a multi-day,
          multi-session build coherent instead of drifting. Without it, each session reinvents
          decisions and you end up with five slightly different versions of the same idea.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground">
          What was mine vs. the AI&apos;s
        </h2>
        <p className="mt-4">
          Mine: the core bet that academic and athletic data should feed each other, and the insight
          engine that acts on it. The call to make parent access passwordless, because parents
          won&apos;t remember a login and a read-only view doesn&apos;t need one. Pinning to Next 14
          instead of the newest release, because the auth and tRPC ecosystem isn&apos;t stable on the
          bleeding edge and shipping mattered more than version numbers. Running insights on demand
          instead of as background jobs, to keep the system legible. The four-role structure itself.
        </p>
        <p className="mt-4">
          The AI&apos;s: a lot of the component and route code, written against those decisions. I
          reviewed and tested every phase before moving to the next one. I never shipped something I
          hadn&apos;t read.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground">
          Where the AI got it wrong — and how I caught it
        </h2>
        <p className="mt-4">This is the part I&apos;d actually want to be asked about.</p>
        <p className="mt-4">
          <strong className="font-semibold text-foreground">
            It invented an API model name that doesn&apos;t exist.
          </strong>{" "}
          The generated code referenced a model string that looked plausible and was completely
          wrong. It compiled. It passed type checks. It passed the build. The only reason I caught it
          is that I&apos;d written an eval suite for the AI features, and the parser scored 0 out of
          25. I traced it to a stale value, fixed the string, and the same suite jumped to 96%. The
          lesson stuck with me: a green build tells you nothing about whether your AI features
          actually work. You need tests that exercise the real thing.
        </p>
        <p className="mt-4">
          <strong className="font-semibold text-foreground">
            A database seed quietly half-finished.
          </strong>{" "}
          It ran through a connection pooler, died partway, and left me with study plans but zero
          training sessions — and it never threw a visible error. &ldquo;Completed&rdquo; is not the
          same as &ldquo;correct.&rdquo; I only found it because I opened the data and looked instead
          of trusting the success message. Switched the seed to a direct connection and it ran clean.
        </p>
        <p className="mt-4">
          Both bugs share a theme, and it&apos;s the thing I believe about building with AI: the
          model is fast and confident, and confidence isn&apos;t correctness. The value I add is
          knowing what to verify and actually verifying it.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground">
          Treating prompts like code
        </h2>
        <p className="mt-4">
          The prompts live in the repo, versioned, the same as any other source file. Every AI
          output is validated against a schema with a retry and a graceful fallback, so a malformed
          response never reaches a user as a broken screen. And the two AI features have an eval
          suite I can run on demand:
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Eval</th>
                <th className="px-4 py-3 text-right font-medium">Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {EVAL_RESULTS.map((r) => (
                <tr key={r.eval} className="border-t">
                  <td className="px-4 py-3 text-foreground">{r.eval}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-accent">
                    {r.pass}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6">
          That suite isn&apos;t decoration. It&apos;s what caught the model-string bug before a single
          user would have hit it.
        </p>
      </article>
    </main>
  );
}
