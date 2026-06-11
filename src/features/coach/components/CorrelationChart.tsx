"use client";

import { useState } from "react";
import {
  Scatter,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/trpc/react";

interface Props {
  studentId: string;
  studentName: string;
}

// Map a Pearson r to a plain-language strength label.
function strengthLabel(absR: number): string {
  if (absR >= 0.7) return "strong";
  if (absR >= 0.4) return "moderate";
  if (absR >= 0.2) return "weak";
  return "negligible";
}

export function CorrelationChart({ studentId, studentName }: Props) {
  const [drill, setDrill] = useState<string | undefined>(undefined);
  const { data, isLoading } = api.coach.crossDomain.useQuery(
    { studentId, drill },
    { staleTime: 60_000 },
  );

  if (isLoading) {
    return <div className="h-56 w-full animate-pulse rounded-xl bg-secondary/40" />;
  }

  if (!data || data.points.length < 3 || !data.drill) {
    return (
      <div className="rounded-xl border-2 border-dashed p-6 text-center">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Not enough paired data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Log a few more sessions on days with study plans to reveal the academic–athletic link.
        </p>
      </div>
    );
  }

  const r = data.correlation ?? 0;
  const absR = Math.abs(r);
  const firstName = studentName.split(" ")[0] ?? studentName;

  // "Good academics helps athletics" when: lower-is-better metric correlates
  // negatively (slower when study drops) OR higher-is-better correlates positively.
  const academicsHelp = data.lowerIsBetter ? r < 0 : r > 0;

  // Build a simple least-squares regression line across the completion range.
  const xs = data.points.map((p) => p.completionPct);
  const ys = data.points.map((p) => p.metricValue);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my);
    den += (xs[i]! - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const trend = [
    { completionPct: minX, trendValue: slope * minX + intercept },
    { completionPct: maxX, trendValue: slope * maxX + intercept },
  ];

  const verdict =
    absR < 0.2
      ? `No clear link between ${firstName}'s study completion and ${data.drill} yet.`
      : academicsHelp
        ? `${firstName}'s ${data.drill} is ${strengthLabel(absR)}ly better on days with higher study completion.`
        : `Heads up: ${firstName}'s ${data.drill} runs worse on high-study days — worth a look.`;

  return (
    <div className="space-y-3">
      {/* Drill selector */}
      {data.drills.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {data.drills.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDrill(d)}
              className={`min-h-[36px] rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                d === data.drill
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              aria-pressed={d === data.drill}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Correlation headline */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-3 ${
          absR < 0.2
            ? "bg-muted/40"
            : academicsHelp
              ? "border-green-200 bg-green-50"
              : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <TrendingUp
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            absR < 0.2 ? "text-muted-foreground" : academicsHelp ? "text-green-600" : "text-yellow-600"
          }`}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium">{verdict}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pearson r = {r.toFixed(2)} · {data.points.length} paired days · last 21 days
          </p>
        </div>
      </div>

      {/* Scatter + regression line */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="completionPct"
              name="Study completion"
              unit="%"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Study completion %",
                position: "insideBottom",
                offset: -8,
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <YAxis
              type="number"
              dataKey="metricValue"
              name={data.drill}
              unit={data.unit ? ` ${data.unit}` : ""}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={["auto", "auto"]}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [
                name === "trendValue" ? Number(value).toFixed(2) : value,
                name === "metricValue" ? data.drill : name === "completionPct" ? "Study %" : "Trend",
              ]}
            />
            <Scatter
              name="metricValue"
              data={data.points}
              fill="hsl(var(--accent))"
              fillOpacity={0.85}
            />
            <Line
              type="linear"
              dataKey="trendValue"
              data={trend}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
