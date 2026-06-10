"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Role } from "@prisma/client";

import { signDemo } from "@/lib/demo-token";
import { audit } from "@/server/audit";
import { DEMO_COOKIE, demoSecret, roleHome } from "@/server/auth/session";
import { db } from "@/server/db";

// Stable emails for the seeded demo users, one per role. The seed script creates
// exactly these so demo entry is deterministic.
const DEMO_EMAILS: Record<Role, string> = {
  STUDENT: "demo-student@tsa.demo",
  COACH: "demo-coach@tsa.demo",
  PARENT: "demo-parent@tsa.demo",
  ADMIN: "demo-admin@tsa.demo",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Enter demo mode as a given role (server action). */
export async function enterDemo(role: Role): Promise<void> {
  const user = await db.user.findUnique({ where: { email: DEMO_EMAILS[role] } });
  if (!user) {
    // No seed data — can't start a demo session.
    redirect("/demo?error=noseed");
  }

  const token = await signDemo(
    {
      userId: user.id,
      role: user.role,
      name: user.name ?? "Demo user",
      exp: Date.now() + SEVEN_DAYS_MS,
    },
    demoSecret(),
  );

  cookies().set(DEMO_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS_MS / 1000,
  });

  await audit(user.id, "demo.enter", "User", user.id);
  redirect(roleHome(role));
}

/** Exit demo mode (server action). */
export async function exitDemo(): Promise<void> {
  cookies().delete(DEMO_COOKIE);
  redirect("/demo");
}
