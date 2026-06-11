import { AttentionList } from "@/features/admin/components/AttentionList";
import { CommandPalette } from "@/features/admin/components/CommandPalette";
import { getSessionUser } from "@/server/auth/session";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <CommandPalette />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.name?.split(" ")[0] ?? "Admin"} &mdash; press{" "}
            <kbd className="rounded border bg-secondary px-1.5 py-0.5 text-xs font-mono">⌘K</kbd>{" "}
            to search
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Needs Attention
        </h2>
        <AttentionList />
      </section>
    </div>
  );
}
