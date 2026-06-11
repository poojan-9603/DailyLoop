"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Dumbbell } from "lucide-react";
import { api } from "@/trpc/react";
import { ProgressRing } from "@/features/student/components/ProgressRing";

interface Props {
  initialStudentId: string;
  students: Array<{ id: string; name: string }>;
}

export function ParentDayView({ initialStudentId, students }: Props) {
  const [selectedId, setSelectedId] = useState(initialStudentId);

  const { data, isLoading } = api.parent.childDay.useQuery({ studentId: selectedId });
  const { data: digests } = api.parent.recentDigests.useQuery({ studentId: selectedId });

  const selectedChild = students.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Child switcher */}
      {students.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {students.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedId === c.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              aria-pressed={selectedId === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Today header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Today</p>
        <h2 className="text-xl font-bold">{selectedChild?.name ?? "Your child"}&apos;s day</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Completion ring */}
          <div className="flex items-center gap-6 rounded-xl border bg-card p-6">
            <ProgressRing
              value={data.completionPct}
              size={80}
              label={`${data.completionPct}%`}
              sublabel="complete"
            />
            <div>
              <p className="text-sm font-semibold">Academic Progress</p>
              <p className="text-sm text-muted-foreground">
                {data.completedTasks} of {data.totalTasks} tasks done
              </p>
            </div>
          </div>

          {/* Task list */}
          {data.tasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Study Tasks</p>
              {data.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                  {t.completed
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.subject} &middot; {t.plannedMinutes}min</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Training sessions */}
          {data.sessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Training</p>
              {data.sessions.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
                  <Dumbbell className="h-4 w-4 shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{s.drill}: {s.value} {s.unit}</p>
                    <p className="text-xs text-muted-foreground">Coach {s.coach}{s.notes ? ` · ${s.notes}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.sessions.length === 0 && data.tasks.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">No activity recorded yet today.</p>
            </div>
          )}
        </>
      ) : null}

      {/* Recent digests */}
      {digests && digests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Digests</p>
          {digests.map((d) => (
            <div key={d.id} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{d.date}</p>
              <p className="text-sm">{d.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
