"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";

import type { NavIconName, NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

// Icon lookup lives inside this client component — never crosses the server/client boundary.
const ICONS: Record<NavIconName, React.ComponentType<{ className?: string }>> = {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Users,
};

function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, iconName }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, href)
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          <NavIcon name={iconName} className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
      {items.map(({ href, label, iconName }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
            isActive(pathname, href) ? "text-accent" : "text-muted-foreground",
          )}
        >
          <NavIcon name={iconName} className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
