"use client";

import dynamic from "next/dynamic";

// Recharts is heavy and client-only — load WeekView dynamically without SSR
// to keep it out of the initial bundle.
const WeekView = dynamic(
  () => import("@/features/student/components/WeekView").then((m) => m.WeekView),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-secondary/40" />,
  },
);

export default function StudentWeekPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Your week</h1>
      <WeekView />
    </div>
  );
}
