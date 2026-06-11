"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Settings, LayoutDashboard, Zap } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/trpc/react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: roster } = api.admin.roster.useQuery(undefined, { enabled: open });

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/admin")} aria-label="Go to dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/roster")} aria-label="Go to roster">
            <Users className="mr-2 h-4 w-4" />
            Roster
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/settings")} aria-label="Go to settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        {roster && roster.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Athletes">
              {roster.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => go(`/admin/roster?student=${s.id}`)}
                  aria-label={`View ${s.name}`}
                >
                  <Zap className="mr-2 h-4 w-4 opacity-40" />
                  {s.name}
                  <span className="ml-auto text-xs text-muted-foreground">Grade {s.gradeLevel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
