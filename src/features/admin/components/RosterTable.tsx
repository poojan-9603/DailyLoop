"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const max = 100;
  const w = 56;
  const h = 20;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} aria-label="7-day completion sparkline">
      <polyline
        points={pts}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  onSelect?: (studentId: string) => void;
}

export function RosterTable({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = api.admin.roster.useQuery();

  const filtered = data?.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase()),
  ) ?? [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search athletes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label="Search roster"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query ? "No athletes match your search" : "No athletes in roster"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Grade</TableHead>
                <TableHead className="hidden md:table-cell">Completion (7d)</TableHead>
                <TableHead className="hidden md:table-cell">Sessions (7d)</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => onSelect?.(s.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelect?.(s.id)}
                  aria-label={`View ${s.name} profile`}
                >
                  <TableCell>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    Grade {s.gradeLevel}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.avgCompletion7d !== null ? (
                      <Badge variant={s.avgCompletion7d >= 80 ? "default" : s.avgCompletion7d >= 50 ? "secondary" : "destructive"}>
                        {s.avgCompletion7d}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.sessionCount7d}</TableCell>
                  <TableCell>
                    <Sparkline values={s.weekSparkline} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
