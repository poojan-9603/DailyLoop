import { existsSync } from "fs";
import path from "path";

import { ArrowRight, PlayCircle, Sparkles, Dumbbell, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { env } from "@/env";

// ---------------------------------------------------------------------------
// Product screenshots (real images, with a clean build-time fallback)
// ---------------------------------------------------------------------------

function screenshotExists(file: string) {
  return existsSync(path.join(process.cwd(), "public", "screenshots", file));
}

function Screenshot({ file, alt, label }: { file: string; alt: string; label: string }) {
  const exists = screenshotExists(file);
  return (
    <Link href="/demo" className="group block focus-visible:outline-none">
      <figure className="overflow-hidden rounded-xl border bg-card shadow-md ring-1 ring-black/[0.03] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:ring-accent/40 group-focus-visible:ring-2 group-focus-visible:ring-accent">
        {/* Faux browser chrome — makes each shot read as a real app window */}
        <div className="flex items-center gap-1.5 border-b bg-secondary/50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2 text-[11px] font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden">
          {exists ? (
            <Image
              src={`/screenshots/${file}`}
              alt={alt}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary/60">
              <span className="text-xs font-medium text-muted-foreground">{label} preview</span>
            </div>
          )}
          {/* Hover overlay CTA */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="mb-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
              Open in demo →
            </span>
          </div>
        </div>
      </figure>
    </Link>
  );
}

const SCREENSHOTS = [
  { file: "student.png", alt: "Student daily study plan", label: "Student" },
  { file: "coach.png", alt: "Coach Smart Log and athlete insights", label: "Coach" },
  { file: "parent.png", alt: "Parent nightly digest", label: "Parent" },
];

const FEATURES = [
  {
    Icon: Sparkles,
    title: "AI-planned mornings",
    note: "A 2-hour study block, generated fresh each day and weighted to what each student needs most.",
  },
  {
    Icon: Dumbbell,
    title: "Seconds-fast coaching",
    note: "Coaches type one messy line; AI structures the drill, metric, and athlete in real time.",
  },
  {
    Icon: TrendingUp,
    title: "Two domains, one signal",
    note: "Academic completion and athletic performance correlate — surfaced as plain-language insights.",
  },
];

const LOOP = [
  { role: "Student", line: "Generates plan, checks off tasks, flips to training" },
  { role: "Coach", line: "Smart-logs sessions, reads cross-domain insights" },
  { role: "Parent", line: "Gets a warm nightly digest via magic link" },
  { role: "Admin", line: "Attention-first dashboard + integrations" },
];

export default function LandingPage() {
  const walkthroughUrl = env.NEXT_PUBLIC_WALKTHROUGH_URL;
  const githubUrl = env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground shadow-sm">
              T
            </div>
            <span className="font-semibold tracking-tight">TSA OS</span>
          </div>
          <nav className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/built-with-ai">Built with AI</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="accent">
              <Link href="/demo">Try the demo</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 [mask-image:radial-gradient(40rem_28rem_at_50%_0%,black,transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
            AI-native operating system for student-athletes
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Where academics and athletics <span className="text-gradient">feed each other</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Two hours of AI-planned academics in the morning, training in the afternoon — one daily
            loop across four roles, with the data from each side making the other smarter.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="accent" className="gap-2">
              <Link href="/demo">
                Try the live demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {walkthroughUrl ? (
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={walkthroughUrl} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="h-4 w-4" />
                  Watch the walkthrough
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/built-with-ai">How it&apos;s built</Link>
              </Button>
            )}
          </div>

          {/* Product screenshots */}
          <div className="mx-auto mt-16 grid max-w-6xl gap-6 text-left sm:grid-cols-3">
            {SCREENSHOTS.map((s, i) => (
              <div
                key={s.file}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <Screenshot file={s.file} alt={s.alt} label={s.label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ Icon, title, note }) => (
            <div key={title} className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily loop */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">One daily loop, four roles</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every role sees a different slice of the same student-athlete&apos;s day.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((step, i) => (
              <div key={step.role} className="relative rounded-xl border bg-card p-5">
                <span className="text-xs font-bold text-accent">0{i + 1}</span>
                <p className="mt-1 font-semibold">{step.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">See the whole loop in action</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          No account needed — step into any of the four roles with seeded, realistic data.
        </p>
        <Button asChild size="lg" variant="accent" className="mt-6 gap-2">
          <Link href="/demo">
            Launch the demo <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Texas Sports Academy — Demo</span>
          <div className="flex gap-4">
            <Link href="/built-with-ai" className="hover:text-foreground">
              Built with AI
            </Link>
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
