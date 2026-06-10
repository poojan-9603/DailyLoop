import { RolePlaceholder } from "@/components/role-placeholder";
import { getSessionUser } from "@/server/auth/session";

export default async function ParentTodayPage() {
  const user = await getSessionUser();
  return (
    <RolePlaceholder
      name={user?.name ?? "Parent"}
      title="Your child's day, in plain language"
      preview={[
        "A warm nightly digest with one real number and one human detail (Phase 4).",
        "Read-only view of academics + training.",
        "Passwordless access via a magic link in the email.",
      ]}
    />
  );
}
