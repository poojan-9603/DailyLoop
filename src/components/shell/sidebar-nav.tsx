"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, Icon }) => (
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
          <Icon className="h-4 w-4" />
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
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
            isActive(pathname, href) ? "text-accent" : "text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
