"use client";

import { format, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

function shortDay(iso: string) {
  try {
    return format(parseISO(iso), "EEE");
  } catch {
    return iso;
  }
}

export function WeekView() {
  const { data, isLoading, error } = api.student.weekData.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load week data. Refresh to try again.
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <p className="text-lg font-semibold">No data yet</p>
        <p className="text-sm text-muted-foreground">
          Complete your first study plan to see weekly progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Daily completion bars */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Daily completion (7 days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.days} barCategoryGap="30%">
            <XAxis
              dataKey="date"
              tickFormatter={shortDay}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(v) => [`${v}%`, "Completion"]}
              labelFormatter={(label) => shortDay(String(label))}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar dataKey="completionPct" radius={[4, 4, 0, 0]}>
              {data.days.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.completionPct >= 80 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Per-subject completion */}
      {data.subjects.length > 0 && (
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            By subject
          </h3>
          <div className="space-y-3">
            {data.subjects
              .sort((a, b) => a.completionPct - b.completionPct)
              .map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.completionPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${s.completionPct}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
