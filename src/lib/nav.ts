import type { Role } from "@prisma/client";

// Icon names are plain strings — resolved to Lucide components inside the
// client component (sidebar-nav.tsx) so no function crosses the server/client boundary.
export type NavIconName =
  | "CalendarDays"
  | "LayoutDashboard"
  | "LineChart"
  | "ListChecks"
  | "Settings"
  | "Users";

export interface NavItem {
  href: string;
  label: string;
  iconName: NavIconName;
}

/** Role-appropriate primary navigation. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Today", iconName: "ListChecks" },
    { href: "/student/week", label: "Week", iconName: "LineChart" },
  ],
  COACH: [
    { href: "/coach", label: "Today", iconName: "ListChecks" },
    { href: "/coach/athletes", label: "Athletes", iconName: "Users" },
  ],
  PARENT: [{ href: "/parent", label: "Today", iconName: "CalendarDays" }],
  ADMIN: [
    { href: "/admin", label: "Dashboard", iconName: "LayoutDashboard" },
    { href: "/admin/roster", label: "Roster", iconName: "Users" },
    { href: "/admin/settings", label: "Settings", iconName: "Settings" },
  ],
};
