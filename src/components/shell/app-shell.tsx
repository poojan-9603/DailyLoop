import { BottomTabs, SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { Badge } from "@/components/ui/badge";
import { NAV_BY_ROLE } from "@/lib/nav";
import type { SessionUser } from "@/server/auth/session";

export function AppShell({
  user,
  orgName,
  children,
}: {
  user: SessionUser;
  orgName: string;
  children: React.ReactNode;
}) {
  const items = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card px-4 py-5 md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">TSA OS</span>
            <span className="text-xs text-muted-foreground">{orgName}</span>
          </div>
        </div>
        {user.isDemo ? (
          <Badge variant="accent" className="mt-3 w-fit">
            Demo · {user.role}
          </Badge>
        ) : null}
        <div className="mt-6 flex-1">
          <SidebarNav items={items} />
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="truncate text-sm text-muted-foreground">{user.name}</span>
          <UserMenu name={user.name} email={user.email} image={user.image} isDemo={user.isDemo} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            T
          </div>
          <span className="text-sm font-semibold">TSA OS</span>
          {user.isDemo ? (
            <Badge variant="accent" className="ml-1">
              Demo
            </Badge>
          ) : null}
        </div>
        <UserMenu name={user.name} email={user.email} image={user.image} isDemo={user.isDemo} />
      </header>

      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>

      <BottomTabs items={items} />
    </div>
  );
}
