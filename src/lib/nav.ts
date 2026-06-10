import {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@prisma/client";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

/** Role-appropriate primary navigation. Phase 1 wires the "Today" home; later
 * phases fill in the rest of these routes. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Today", Icon: ListChecks },
    { href: "/student/week", label: "Week", Icon: LineChart },
  ],
  COACH: [
    { href: "/coach", label: "Today", Icon: ListChecks },
    { href: "/coach/athletes", label: "Athletes", Icon: Users },
  ],
  PARENT: [{ href: "/parent", label: "Today", Icon: CalendarDays }],
  ADMIN: [
    { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/admin/roster", label: "Roster", Icon: Users },
    { href: "/admin/settings", label: "Settings", Icon: Settings },
  ],
};
