"use client";

import { api } from "@/trpc/react";
import { AthleteCard } from "./AthleteCard";
import { Users } from "lucide-react";

export function AthleteListWrapper() {
  const { data, isLoading } = api.coach.myAthletes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-8 text-center">
        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No athlete sessions logged yet</p>
        <p className="text-xs text-muted-foreground mt-1">Use the Smart Log above to record your first session</p>
      </div>
    );
  }

  return (
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
  );
}
