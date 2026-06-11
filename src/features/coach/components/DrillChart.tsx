"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface DrillPoint {
  date: string;
  value: number;
  unit: string;
}

interface Drill {
  drill: string;
  points: DrillPoint[];
}

interface Props {
  drills: Drill[];
}

export function DrillChart({ drills }: Props) {
  const [selected, setSelected] = useState(drills[0]?.drill ?? "");
  const current = drills.find((d) => d.drill === selected);

  if (drills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        No drill data in the last 14 days
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drill selector */}
      {drills.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {drills.map((d) => (
            <button
              key={d.drill}
              onClick={() => setSelected(d.drill)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === d.drill ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-secondary"}`}
              aria-pressed={selected === d.drill}
            >
              {d.drill}
            </button>
          ))}
        </div>
      )}

      {current && current.points.length > 0 && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={current.points} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  try { return format(parseISO(String(v)), "M/d"); } catch { return String(v); }
                }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(v) => [`${v} ${current.points[0]?.unit ?? ""}`, selected]}
                labelFormatter={(l) => {
                  try { return format(parseISO(String(l)), "MMM d"); } catch { return String(l); }
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--accent))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
