import { ArrowRight, CheckCircle2, Circle, Sparkles, Wand2, Dumbbell, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Tiny realistic product previews (pure CSS — no screenshots)
// ---------------------------------------------------------------------------

function MiniRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" className="stroke-secondary" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="stroke-accent"
      />
    </svg>
  );
}

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]">{children}</div>
  );
}

function StudentPreview() {
  const tasks = [
    { subject: "Algebra", title: "Quadratics set 3B", done: true },
    { subject: "Biology", title: "Cell respiration notes", done: true },
    { subject: "English", title: "Essay outline", done: false },
  ];
  return (
    <PreviewFrame>
      <div className="flex items-center gap-3">
        <MiniRing pct={67} />
        <div>
          <p className="text-sm font-semibold">Today&apos;s study block</p>
          <p className="text-xs text-muted-foreground">2 of 3 tasks · 110 min</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {tasks.map((t) => (
          <div key={t.title} className="flex items-center gap-2 rounded-lg border bg-background/60 px-2.5 py-2">
            {t.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {t.subject}
            </span>
            <span className={`truncate text-xs ${t.done ? "text-muted-foreground line-through" : ""}`}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function CoachPreview() {
  return (
    <PreviewFrame>
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold">Smart Log</p>
      </div>
      <div className="mt-3 rounded-lg border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        &ldquo;marcus 40yd 4.92, slight knee drop on start&rdquo;
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <span className="text-muted-foreground">→</span>
        <span className="rounded-md bg-accent/10 px-2 py-1 font-medium text-accent">Marcus Hill</span>
        <span className="rounded-md bg-secondary px-2 py-1 font-medium">40yd dash</span>
        <span className="rounded-md bg-secondary px-2 py-1 font-medium tabular-nums">4.92s</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Note: slight knee drop on start</p>
    </PreviewFrame>
  );
}

function ParentPreview() {
  return (
    <PreviewFrame>
      <div className="flex items-center gap-3">
        <MiniRing pct={88} />
        <div>
          <p className="text-sm font-semibold">Marcus&apos;s day</p>
          <p className="text-xs text-muted-foreground">Tonight&apos;s digest</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/80">
        Marcus finished <span className="font-semibold text-foreground">88%</span> of his study plan and
        shaved 0.07s off his 40-yard dash. He stayed focused through a tough biology set — proud of him today.
      </p>
    </PreviewFrame>
  );
}

const FEATURES = [
  {
    Icon: Sparkles,
    title: "AI-planned mornings",
    note: "A 2-hour study block, generated fresh each day and weighted to what each student needs most.",
    Preview: StudentPreview,
  },
  {
    Icon: Dumbbell,
    title: "Seconds-fast coaching",
    note: "Coaches type one messy line; AI structures the drill, metric, and athlete in real time.",
    Preview: CoachPreview,
  },
  {
    Icon: TrendingUp,
    title: "Two domains, one signal",
    note: "Academic completion and athletic performance correlate — surfaced as plain-language insights.",
    Preview: ParentPreview,
  },
];

const LOOP = [
  { role: "Student", line: "Generates plan, checks off tasks, flips to training" },
  { role: "Coach", line: "Smart-logs sessions, reads cross-domain insights" },
  { role: "Parent", line: "Gets a warm nightly digest via magic link" },
  { role: "Admin", line: "Attention-first dashboard + integrations" },
];

export default function LandingPage() {
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
            Where academics and athletics{" "}
            <span className="text-gradient">feed each other</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Two hours of AI-planned academics in the morning, training in the afternoon — one daily
            loop across four roles, with the data from each side making the other smarter.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" variant="accent" className="gap-2">
              <Link href="/demo">
                Try the live demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/built-with-ai">How it&apos;s built</Link>
            </Button>
          </div>

          {/* Floating product previews */}
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 text-left sm:grid-cols-3">
            <div className="animate-fade-in">
              <StudentPreview />
            </div>
            <div className="animate-fade-in [animation-delay:120ms] sm:mt-6">
              <CoachPreview />
            </div>
            <div className="animate-fade-in [animation-delay:240ms]">
              <ParentPreview />
            </div>
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
            <a href="https://github.com" className="hover:text-foreground">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
