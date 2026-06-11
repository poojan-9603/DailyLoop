"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  drill: string;
  value: number;
  unit: string;
  todayCompletionPct: number | null;
}

function CompletionDot({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">No plan</span>;
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", color)} aria-hidden="true" />
      <span className="text-xs text-muted-foreground">{pct}% academic</span>
    </div>
  );
}

export function AthleteCard({ id, name, drill, value, unit, todayCompletionPct }: Props) {
  return (
    <Link
      href={`/coach/athletes/${id}`}
      className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/40 min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View ${name}'s profile`}
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">
          Last: {drill} — {value} {unit}
        </p>
      </div>
      <CompletionDot pct={todayCompletionPct} />
    </Link>
  );
}
