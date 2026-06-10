import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SCREENSHOTS = [
  { title: "Student Today", note: "AI plan + the flip to training" },
  { title: "Coach Smart Log", note: "Type it; AI structures it" },
  { title: "Parent Digest", note: "One number, one human detail" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            T
          </div>
          <span className="font-semibold">TSA OS</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/built-with-ai">Built with AI</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/demo">Try the demo</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          The operating system for the student-athlete&apos;s day
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Two hours of AI-planned academics in the morning, training in the afternoon — where
          academic data and athletic data feed each other.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" variant="accent">
            <Link href="/demo">
              Try the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {SCREENSHOTS.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-0">
              {/* TODO(Phase 5): replace with real product screenshots */}
              <div className="flex aspect-[4/3] items-center justify-center rounded-t-xl bg-secondary text-sm text-muted-foreground">
                Screenshot
              </div>
              <div className="p-4">
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Texas Sports Academy — Demo</span>
          <div className="flex gap-4">
            <Link href="/built-with-ai" className="hover:text-foreground">
              Built with AI
            </Link>
            <a href="https://github.com" className="hover:text-foreground">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
