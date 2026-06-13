"use client";

import { useState, useEffect, useRef } from "react";
import { experimental_useObject as useObject } from "ai/react";
import { Sparkles, RefreshCw, Dumbbell, AlertCircle, ArrowLeft, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { PlanOutputSchema } from "@/ai/schemas";
import { TaskCard } from "./TaskCard";
import { ProgressRing } from "./ProgressRing";

// ---------------------------------------------------------------------------
// Types mirroring Prisma results
// ---------------------------------------------------------------------------
type TrainingSession = {
  id: string;
  drill: string;
  value: number;
  unit: string;
  createdAt: Date;
  coach: { user: { name: string | null } };
};

// ---------------------------------------------------------------------------
// "This afternoon" preview — surfaces the athletic half of the daily loop
// up front, alongside the study block (not gated behind task completion).
// ---------------------------------------------------------------------------
function formatDay(date: string): string {
  // date is "YYYY-MM-DD"; pin to local noon to avoid timezone day-shifts.
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function AfternoonPreview({
  sessions,
  isToday,
  date,
  tasksComplete,
}: {
  sessions: TrainingSession[];
  isToday: boolean;
  date: string | null;
  tasksComplete: boolean;
}) {
  // Historical sessions (not today) are already in the past, so their details
  // are always shown; today's details stay gated behind finishing academics.
  const showDetails = isToday ? tasksComplete : true;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Dumbbell className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">
          {isToday ? "This afternoon — Training" : "Recent training"}
        </h3>
        {date && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {isToday ? "This afternoon" : formatDay(date)}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No training scheduled this afternoon.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-1.5">
            {sessions.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.drill}</span>{" "}
                <span className="text-muted-foreground">· Coach {s.coach.user.name ?? "TBA"}</span>
                {showDetails && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {s.value} {s.unit}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            {!isToday ? (
              <>
                <Dumbbell className="h-3 w-3 text-accent" />
                Most recent session — today&apos;s training appears once your coach logs it.
              </>
            ) : tasksComplete ? (
              <>
                <Dumbbell className="h-3 w-3 text-accent" />
                Academics done — training details unlocked.
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Finish your 2 hours to unlock training details.
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Afternoon flip panel
// ---------------------------------------------------------------------------
function AfternoonFlip({
  sessions,
  isToday,
  date,
  onBack,
  onRegenerate,
  regenerating,
}: {
  sessions: TrainingSession[];
  isToday: boolean;
  date: string | null;
  onBack: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      {/* Back to academics — never strand the student on the flip view */}
      <div className="w-full max-w-sm self-start">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to academics
        </Button>
      </div>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
        <Dumbbell className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Academics done!</h2>
        <p className="mt-1 text-muted-foreground">Time to train. Great focus today.</p>
      </div>
      {sessions.length > 0 ? (
        <div className="w-full max-w-sm rounded-lg border bg-card p-4 text-left">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isToday ? "Today's training" : `Recent training${date ? ` · ${formatDay(date)}` : ""}`}
          </p>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.drill}</span>{" "}
                <span className="text-muted-foreground">
                  — {s.value} {s.unit} · Coach {s.coach.user.name ?? "TBA"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-4 text-sm text-muted-foreground">
          No training scheduled for this afternoon.
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onRegenerate}
        disabled={regenerating}
      >
        <RefreshCw className="h-3 w-3" />
        Plan a new study block
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function TodayView() {
  const utils = api.useUtils();

  // --- Server state ---
  const { data: plan, isLoading: planLoading } = api.student.todayPlan.useQuery(undefined, {
    staleTime: 60_000,
  });
  const { data: afternoon } = api.student.afternoonTraining.useQuery(undefined, {
    staleTime: 60_000,
  });
  const trainingSessions = afternoon?.sessions ?? [];
  const trainingIsToday = afternoon?.isToday ?? false;
  const trainingDate = afternoon?.date ?? null;

  // --- Local state ---
  const [isFallback, setIsFallback] = useState(false);
  const [showFlip, setShowFlip] = useState(false);

  // The flip is a reward for finishing the last task IN THIS SESSION — it must
  // not auto-trigger when a plan loads already-complete (e.g. yesterday's demo
  // plan), which would dead-end on "Academics done / no training scheduled".
  const sawIncompleteRef = useRef(false);
  useEffect(() => {
    if (!plan || plan.tasks.length === 0) return;
    const allDone = plan.tasks.every((t) => t.completed);
    if (!allDone) {
      sawIncompleteRef.current = true;
    } else if (sawIncompleteRef.current) {
      setShowFlip(true);
    }
  }, [plan]);

  // --- Mutations ---
  const persistPlan = api.student.persistPlan.useMutation({
    onSuccess: () => {
      void utils.student.todayPlan.invalidate();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Couldn't save plan", description: "Please try again." });
    },
  });

  const fallbackMutation = api.student.fallbackPlan.useMutation({
    onSuccess: () => {
      setIsFallback(true);
      void utils.student.todayPlan.invalidate();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fallback failed", description: "Please refresh and try again." });
    },
  });

  const completeTask = api.student.completeTask.useMutation({
    onSuccess: (updated) => {
      void utils.student.todayPlan.invalidate();
      if (updated.completed) {
        track("task_completed", { taskId: updated.id });
      }
    },
    onError: () => {
      // Revert optimistic check-off by re-syncing with server truth.
      void utils.student.todayPlan.invalidate();
      toast({
        variant: "destructive",
        title: "Couldn't update task",
        description: "Your change didn't save — please try again.",
      });
    },
  });

  const updateMinutes = api.student.updateActualMinutes.useMutation();

  // --- Streaming ---
  const {
    object: streamingPlan,
    isLoading: isStreaming,
    submit: startStream,
    error: streamError,
  } = useObject({
    api: "/api/ai/generate-plan",
    schema: PlanOutputSchema,
    onFinish: ({ object, error }) => {
      if (error || !object) {
        // Streaming failed — load fallback
        fallbackMutation.mutate();
        return;
      }
      track("plan_generated", { taskCount: object.tasks.length });
      persistPlan.mutate({
        tasks: object.tasks.map((t) => ({
          subjectId: t.subjectId,
          subjectName: t.subjectName,
          title: t.title,
          plannedMinutes: t.plannedMinutes,
          reason: t.reason,
        })),
      });
    },
    onError: () => {
      fallbackMutation.mutate();
    },
  });

  // Also fall back if streamError surfaces
  useEffect(() => {
    if (streamError && !fallbackMutation.isPending && !plan) {
      fallbackMutation.mutate();
    }
  }, [streamError]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function handleToggle(taskId: string, completed: boolean) {
    completeTask.mutate({ taskId, completed });
  }

  // Regenerate always exits the flip first so the user is never stranded on the
  // afternoon view while a new plan streams in.
  function handleRegenerate() {
    setShowFlip(false);
    sawIncompleteRef.current = false;
    startStream({});
  }

  function handleTimerStop(taskId: string, totalSeconds: number) {
    updateMinutes.mutate({ taskId, actualMinutes: Math.round(totalSeconds / 60) });
  }

  // Progress ring: % of total planned minutes that are completed
  const completedMinutes = (plan?.tasks ?? [])
    .filter((t) => t.completed)
    .reduce((s, t) => s + t.plannedMinutes, 0);
  const totalPlanned = plan?.totalMinutes ?? 120;
  const progressPct = Math.round((completedMinutes / totalPlanned) * 100);

  const completedCount = (plan?.tasks ?? []).filter((t) => t.completed).length;
  const totalCount = plan?.tasks.length ?? 0;

  // ---------------------------------------------------------------------------
  // SKELETON — initial load
  // ---------------------------------------------------------------------------
  if (planLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLIP — all tasks complete
  // ---------------------------------------------------------------------------
  if (showFlip) {
    return (
      <div
        className={cn(
          "transition-all duration-500 ease-in-out",
          showFlip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <AfternoonFlip
          sessions={trainingSessions}
          isToday={trainingIsToday}
          date={trainingDate}
          onBack={() => setShowFlip(false)}
          onRegenerate={handleRegenerate}
          regenerating={isStreaming}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NO PLAN + STREAMING in progress — show tasks as they arrive
  // ---------------------------------------------------------------------------
  if (isStreaming) {
    const streamedTasks = streamingPlan?.tasks ?? [];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          Building your study plan…
        </div>
        <div className="space-y-3">
          {streamedTasks.map((t, i) => (
            <TaskCard
              key={i}
              id={String(i)}
              title={t?.title ?? "…"}
              subjectName={t?.subjectName ?? "…"}
              plannedMinutes={t?.plannedMinutes ?? 0}
              reason={t?.reason ?? null}
              completed={false}
              onToggle={() => {}}
              onTimerStop={() => {}}
              streaming
            />
          ))}
          {/* placeholder for the next task being generated */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NO PLAN — "Generate my 2 hours" CTA
  // ---------------------------------------------------------------------------
  if (!plan && !isStreaming) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Good morning!</h2>
          <p className="mt-1 text-muted-foreground">
            Let AI plan your 2-hour study block &mdash; tailored to what you need most today.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => startStream({})}
          disabled={isStreaming || persistPlan.isPending}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate my 2 hours
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PLAN EXISTS — checklist
  // ---------------------------------------------------------------------------
  if (plan) {
    return (
      <div className="space-y-6">
        {/* Fallback banner */}
        {isFallback && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Using yesterday&apos;s plan &mdash; tap to regenerate.</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto py-0 text-yellow-700"
              onClick={handleRegenerate}
              disabled={isStreaming}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Regenerate
            </Button>
          </div>
        )}

        {/* Progress ring + header */}
        <div className="flex items-center gap-5">
          <ProgressRing
            value={progressPct}
            size={88}
            strokeWidth={8}
            label={`${progressPct}%`}
            sublabel="done"
          />
          <div>
            <h2 className="text-lg font-semibold">Today&apos;s study block</h2>
            <p className="text-xs font-medium text-accent">Morning: academics · Afternoon: training</p>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} tasks · {totalPlanned} min planned
            </p>
            {totalCount > 0 && completedCount === totalCount && (
              <button
                type="button"
                onClick={() => setShowFlip(true)}
                className="mt-1 text-sm font-medium text-primary hover:underline"
              >
                All done! Flip to training →
              </button>
            )}
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {plan.tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              subjectName={task.subject.name}
              plannedMinutes={task.plannedMinutes}
              reason={task.reason}
              completed={task.completed}
              actualMinutes={task.actualMinutes}
              onToggle={handleToggle}
              onTimerStop={handleTimerStop}
            />
          ))}
        </div>

        {/* This afternoon — surfaces the athletic half up front */}
        <AfternoonPreview
          sessions={trainingSessions}
          isToday={trainingIsToday}
          date={trainingDate}
          tasksComplete={totalCount > 0 && completedCount === totalCount}
        />

        {/* Re-generate option (after plan saved) */}
        {!isFallback && (
          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleRegenerate}
              disabled={isStreaming}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate plan
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
