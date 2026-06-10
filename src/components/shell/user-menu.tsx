"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exitDemo } from "@/server/auth/demo";
import { signOutAction } from "@/server/auth/actions";

export function UserMenu({
  name,
  email,
  image,
  isDemo,
}: {
  name: string;
  email: string | null;
  image: string | null;
  isDemo: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name}</span>
            {email ? <span className="text-xs text-muted-foreground">{email}</span> : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={isDemo ? exitDemo : signOutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <LogOut className="h-4 w-4" />
              {isDemo ? "Exit demo" : "Sign out"}
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
