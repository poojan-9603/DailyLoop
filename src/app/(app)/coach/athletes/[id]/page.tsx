"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { InsightCard } from "@/features/coach/components/InsightCard";

// Recharts is client-only and heavy — load the charts without SSR.
const DrillChart = dynamic(
  () => import("@/features/coach/components/DrillChart").then((m) => m.DrillChart),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-secondary/40" />,
  },
);
const CorrelationChart = dynamic(
  () => import("@/features/coach/components/CorrelationChart").then((m) => m.CorrelationChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-secondary/40" />,
  },
);
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: { id: string };
}

export default function AthleteDetailPage({ params }: Props) {
  const { id } = params;
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data, isLoading } = api.coach.athleteDetail.useQuery(
    { studentId: id },
    { staleTime: 60_000 },
  );

  const insightMutation = api.coach.generateInsight.useMutation({
    onSuccess: (result) => {
      if (result.skipped) {
        toast({ title: "Insight skipped", description: result.reason ?? "" });
      } else {
        toast({ title: "Insight generated" });
        void utils.coach.athleteDetail.invalidate({ studentId: id });
      }
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [refetchKey, setRefetchKey] = useState(0);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4 pb-20 md:pb-6">
        <div className="h-8 w-32 rounded bg-secondary/40 animate-pulse" />
        <div className="h-48 rounded-xl bg-secondary/40 animate-pulse" />
        <div className="h-48 rounded-xl bg-secondary/40 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-muted-foreground">Athlete not found.</p>
      </div>
    );
  }

  return (
    <div key={refetchKey} className="mx-auto max-w-xl px-4 py-6 space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/coach/athletes"
          className="rounded-md p-1.5 hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back to athletes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">{data.student.name}</h1>
      </div>

      {/* Drill progression chart */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Drill Progression (14 days)
        </h2>
        <div className="rounded-xl border bg-card p-4">
          <DrillChart drills={data.drills} />
        </div>
      </section>

      {/* Cross-domain correlation — the product thesis, made visible */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Academic ↔ Athletic Link
          </h2>
          <Badge variant="secondary" className="text-[10px]">
            Cross-domain
          </Badge>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <CorrelationChart studentId={id} studentName={data.student.name} />
        </div>
      </section>

      {/* Insights */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Insights
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insightMutation.mutate({ studentId: id })}
            disabled={insightMutation.isPending}
            aria-label="Generate new insight"
          >
            {insightMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Zap className="h-3.5 w-3.5 mr-1" />Generate</>
            )}
          </Button>
        </div>

        {data.insights.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No active insights</p>
            <p className="text-xs text-muted-foreground mt-1">Click Generate to run the insight engine</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.insights.map((i) => (
              <InsightCard
                key={i.id}
                id={i.id}
                type={i.type}
                content={i.content}
                createdAt={i.createdAt}
                onDismissed={() => {
                  setRefetchKey((k) => k + 1);
                  void utils.coach.athleteDetail.invalidate({ studentId: id });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Session history */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Recent Sessions
        </h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions in the last 14 days.</p>
        ) : (
          <div className="space-y-2">
            {[...data.sessions].reverse().map((s) => (
              <div key={s.id} className="rounded-xl border bg-card px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.drill}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.date} {s.notes ? `· ${s.notes}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {s.value} {s.unit}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
