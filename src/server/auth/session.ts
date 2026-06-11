import { cookies } from "next/headers";

import type { Role } from "@prisma/client";

import { env } from "@/env";
import { verifyDemo } from "@/lib/demo-token";
import { verifyMagic } from "@/lib/magic-token";
import { auth } from "@/server/auth";

export const DEMO_COOKIE = "tsa_demo";
export const PARENT_COOKIE = "tsa_parent";

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  role: Role;
  isDemo: boolean;
}

/** The secret used to sign demo tokens. Must match the middleware (AUTH_SECRET). */
export function demoSecret(): string {
  return env.AUTH_SECRET;
}

/**
 * Resolve the current user from either a real Auth.js session or an active demo
 * cookie. Demo takes precedence so a developer testing demo mode while also
 * signed in via Google still lands in the demo experience.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const demoCookie = cookies().get(DEMO_COOKIE)?.value;
  if (demoCookie) {
    const payload = await verifyDemo(demoCookie, demoSecret());
    if (payload) {
      return {
        id: payload.userId,
        name: payload.name,
        email: null,
        image: null,
        role: payload.role,
        isDemo: true,
      };
    }
  }

  // Parent magic-link session
  const parentCookie = cookies().get(PARENT_COOKIE)?.value;
  if (parentCookie) {
    const secret = env.MAGIC_LINK_SECRET ?? env.AUTH_SECRET;
    const payload = await verifyMagic(parentCookie, secret);
    if (payload) {
      return {
        id: payload.userId,
        name: payload.name,
        email: null,
        image: null,
        role: "PARENT" as Role,
        isDemo: false,
      };
    }
  }

  const session = await auth();
  if (session?.user) {
    return {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      role: session.user.role,
      isDemo: false,
    };
  }

  return null;
}

/** Lowercased home path for a role. */
export function roleHome(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "COACH":
      return "/coach";
    case "PARENT":
      return "/parent";
    case "ADMIN":
      return "/admin";
  }
}
