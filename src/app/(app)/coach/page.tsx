import { RolePlaceholder } from "@/components/role-placeholder";
import { getSessionUser } from "@/server/auth/session";

export default async function CoachTodayPage() {
  const user = await getSessionUser();
  return (
    <RolePlaceholder
      name={user?.name ?? "Coach"}
      title="Log fast, see progress"
      preview={[
        "Smart Log: type a messy session line, AI structures it (Phase 3).",
        "Athletes-today list with academic completion at a glance.",
        "Per-athlete charts and cross-domain insights.",
      ]}
    />
  );
}
