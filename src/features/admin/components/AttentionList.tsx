"use client";

import Link from "next/link";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { api } from "@/trpc/react";

export function AttentionList() {
  const { data, isLoading } = api.admin.attentionList.useQuery(undefined, { staleTime: 60_000 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">All athletes on track</p>
        <p className="text-xs text-muted-foreground mt-1">No attention items today</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const Icon = item.severity === "high" ? AlertCircle : AlertTriangle;
        const color = item.severity === "high" ? "text-destructive" : "text-yellow-500";
        return (
          <Link
            key={item.studentId}
            href={`/admin/roster?student=${item.studentId}`}
            className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View ${item.name}'s profile`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.reason}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
