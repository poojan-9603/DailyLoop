import { WeekView } from "@/features/student/components/WeekView";

export default function StudentWeekPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Your week</h1>
      <WeekView />
    </div>
  );
}
