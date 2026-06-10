import { RolePlaceholder } from "@/components/role-placeholder";
import { getSessionUser } from "@/server/auth/session";

export default async function StudentTodayPage() {
  const user = await getSessionUser();
  return (
    <RolePlaceholder
      name={user?.name ?? "Student"}
      title="Your 2-hour morning, then training"
      preview={[
        "Generate an AI study plan and watch tasks stream in (Phase 2).",
        "Check off tasks with a per-task timer and progress ring.",
        "When academics are done, flip to today's training schedule.",
      ]}
    />
  );
}
