import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Built with AI — TSA OS",
};

export default function BuiltWithAiPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/">← Home</Link>
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">Built with AI</h1>
      <p className="mt-3 text-muted-foreground">
        An honest write-up of the AI-assisted development workflow behind TSA OS.
      </p>

      {/* TODO(Phase 5): the developer fills these sections in honestly. */}
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold">Tools I used</h2>
          <p className="text-sm text-muted-foreground">TODO</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">What AI wrote vs. what I wrote</h2>
          <p className="text-sm text-muted-foreground">TODO</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Two places AI failed</h2>
          <p className="text-sm text-muted-foreground">TODO</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">How prompts are versioned and evaled</h2>
          <p className="text-sm text-muted-foreground">TODO — link evals/results.md</p>
        </section>
      </div>
    </main>
  );
}
