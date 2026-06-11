"use client";

import { X, TrendingUp, AlertTriangle, Activity, Zap } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import type { InsightType } from "@prisma/client";

const INSIGHT_META: Record<InsightType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  PLATEAU: { icon: AlertTriangle, label: "Plateau", color: "text-yellow-500" },
  IMPROVEMENT: { icon: TrendingUp, label: "Improvement", color: "text-green-500" },
  CONSISTENCY: { icon: Activity, label: "Consistency", color: "text-blue-500" },
  CROSS_DOMAIN: { icon: Zap, label: "Cross-Domain", color: "text-accent" },
};

interface Props {
  id: string;
  type: InsightType;
  content: string;
  createdAt: Date;
  onDismissed?: () => void;
}

export function InsightCard({ id, type, content, createdAt, onDismissed }: Props) {
  const { toast } = useToast();
  const meta = INSIGHT_META[type];
  const Icon = meta.icon;

  const dismissMutation = api.coach.dismissInsight.useMutation({
    onSuccess: () => {
      toast({ title: "Insight dismissed" });
      onDismissed?.();
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4 flex gap-3">
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.color}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {createdAt.toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm">{content}</p>
      </div>
      <button
        onClick={() => dismissMutation.mutate({ insightId: id })}
        disabled={dismissMutation.isPending}
        className="shrink-0 rounded-sm opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label="Dismiss insight"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
