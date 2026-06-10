import { GraduationCap, Users, Dumbbell, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enterDemo } from "@/server/auth/demo";

const ROLES: Array<{
  role: Role;
  title: string;
  blurb: string;
  Icon: typeof GraduationCap;
}> = [
  {
    role: "STUDENT",
    title: "Student",
    blurb: "Generate an AI 2-hour study plan, then flip to today's training.",
    Icon: GraduationCap,
  },
  {
    role: "COACH",
    title: "Coach",
    blurb: "Smart-log sessions in seconds and see athlete progress + insights.",
    Icon: Dumbbell,
  },
  {
    role: "PARENT",
    title: "Parent",
    blurb: "A warm, read-only view of your child's academic + athletic day.",
    Icon: Users,
  },
  {
    role: "ADMIN",
    title: "Admin",
    blurb: "Attention-first dashboard, roster, and integrations.",
    Icon: ShieldCheck,
  },
];

export default function DemoPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">View TSA OS as…</h1>
        <p className="mt-2 text-muted-foreground">
          One daily loop, four roles. Pick a seat — no account required.
        </p>
        {searchParams.error === "noseed" ? (
          <p className="mx-auto mt-4 max-w-md rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No demo data found. Run <code>npm run db:seed</code> against a database first.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map(({ role, title, blurb, Icon }) => (
          <Card key={role} className="transition-shadow hover:shadow-md">
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
              <form
                action={async () => {
                  "use server";
                  await enterDemo(role);
                }}
              >
                <Button type="submit" variant="accent" className="w-full">
                  Enter as {title}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
