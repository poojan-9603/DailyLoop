"use client";

import { api } from "@/trpc/react";
import { AthleteCard } from "@/features/coach/components/AthleteCard";
import { Users } from "lucide-react";

export default function CoachAthletesPage() {
  const { data, isLoading } = api.coach.myAthletes.useQuery(undefined, { staleTime: 60_000 });

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Athletes</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm font-medium">No athletes yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Log a session on the Today page to see athletes here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((a) => (
            <AthleteCard
              key={a.id}
              id={a.id}
              name={a.name}
              drill={a.drill}
              value={a.value}
              unit={a.unit}
              todayCompletionPct={a.todayCompletionPct}
            />
          ))}
        </div>
      )}
    </div>
  );
}
