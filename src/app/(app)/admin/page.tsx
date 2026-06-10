import { RolePlaceholder } from "@/components/role-placeholder";
import { getSessionUser } from "@/server/auth/session";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  return (
    <RolePlaceholder
      name={user?.name ?? "Admin"}
      title="Attention-first dashboard"
      preview={[
        "“Needs attention today” flags for declining students (Phase 4).",
        "Roster management, student detail, invites.",
        "Integrations: Slack, Notion, Workable; ⌘K command palette.",
      ]}
    />
  );
}
