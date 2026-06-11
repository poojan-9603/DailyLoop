"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskTimer } from "./TaskTimer";

interface TaskCardProps {
  id: string;
  title: string;
  subjectName: string;
  plannedMinutes: number;
  reason?: string | null;
  completed: boolean;
  actualMinutes?: number | null;
  onToggle: (id: string, completed: boolean) => void;
  onTimerStop: (id: string, seconds: number) => void;
  streaming?: boolean; // true while task is being streamed in
}

export function TaskCard({
  id,
  title,
  subjectName,
  plannedMinutes,
  reason,
  completed,
  actualMinutes,
  onToggle,
  onTimerStop,
  streaming,
}: TaskCardProps) {
  const [optimisticDone, setOptimisticDone] = useState(completed);

  function handleToggle() {
    if (streaming) return;
    const next = !optimisticDone;
    setOptimisticDone(next);
    onToggle(id, next);
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all duration-200",
        optimisticDone && "opacity-60",
        streaming && "animate-pulse",
      )}
    >
      {/* Check button */}
      <button
        onClick={handleToggle}
        disabled={streaming}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary focus:outline-none"
        aria-label={optimisticDone ? "Mark incomplete" : "Mark complete"}
      >
        {optimisticDone ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        {/* Subject chip + title */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {subjectName}
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              optimisticDone && "line-through text-muted-foreground",
            )}
          >
            {title}
          </span>
        </div>

        {/* Reason */}
        {reason && !streaming && (
          <p className="text-xs text-muted-foreground">{reason}</p>
        )}

        {/* Footer: planned time + timer */}
        <div className="flex items-center gap-3 pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {plannedMinutes} min planned
          </span>
          {!streaming && (
            <TaskTimer
              initialSeconds={(actualMinutes ?? 0) * 60}
              onStop={(secs) => onTimerStop(id, secs)}
              disabled={optimisticDone}
            />
          )}
        </div>
      </div>
    </div>
  );
}
