import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DemoRoleCards } from "@/features/demo/DemoRoleCards";

export default function DemoPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">View TSA OS as…</h1>
        <p className="mt-2 text-muted-foreground">
          One daily loop, four roles. Pick a seat — no account required.
        </p>
        {searchParams.error === "noseed" ? (
          <p className="mx-auto mt-4 max-w-md rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No demo data found. Run <code>npm run db:seed</code> against a database first.
          </p>
        ) : null}
      </div>

      <DemoRoleCards />

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
