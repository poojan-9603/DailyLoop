import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  // Org name for the shell. Best-effort: fall back if the DB isn't reachable.
  let orgName = "Texas Sports Academy";
  try {
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: { org: { select: { name: true } } },
    });
    if (record?.org?.name) orgName = record.org.name;
  } catch {
    // keep fallback
  }

  return (
    <AppShell user={user} orgName={orgName}>
      {children}
    </AppShell>
  );
}
