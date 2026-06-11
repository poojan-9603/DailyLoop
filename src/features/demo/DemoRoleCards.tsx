"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Users, Dumbbell, ShieldCheck, Loader2 } from "lucide-react";

import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enterDemo } from "@/server/auth/demo";

// Icons live inside this client component so no function crosses the
// server/client boundary.
const ROLES: Array<{
  role: Role;
  title: string;
  blurb: string;
  home: string;
  Icon: typeof GraduationCap;
}> = [
  {
    role: "STUDENT",
    title: "Student",
    blurb: "Generate an AI 2-hour study plan, then flip to today's training.",
    home: "/student",
    Icon: GraduationCap,
  },
  {
    role: "COACH",
    title: "Coach",
    blurb: "Smart-log sessions in seconds and see athlete progress + insights.",
    home: "/coach",
    Icon: Dumbbell,
  },
  {
    role: "PARENT",
    title: "Parent",
    blurb: "A warm, read-only view of your child's academic + athletic day.",
    home: "/parent",
    Icon: Users,
  },
  {
    role: "ADMIN",
    title: "Admin",
    blurb: "Attention-first dashboard, roster, and integrations.",
    home: "/admin",
    Icon: ShieldCheck,
  },
];

export function DemoRoleCards() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  // Prefetch every role home so the post-cookie redirect lands instantly.
  useEffect(() => {
    for (const { home } of ROLES) router.prefetch(home);
  }, [router]);

  function handleEnter(role: Role) {
    setPendingRole(role); // instant optimistic feedback on the clicked card
    startTransition(async () => {
      await enterDemo(role);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ROLES.map(({ role, title, blurb, Icon }) => {
        const isPending = pendingRole === role;
        return (
          <Card
            key={role}
            className={`transition-all hover:shadow-md ${isPending ? "animate-pulse ring-2 ring-accent" : ""}`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
              </div>
              <CardDescription className="pt-1">{blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="accent"
                className="w-full"
                onClick={() => handleEnter(role)}
                disabled={pendingRole !== null}
                aria-label={`Enter demo as ${title}`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entering…
                  </>
                ) : (
                  `Enter as ${title}`
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
