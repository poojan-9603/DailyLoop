import { NextResponse } from "next/server";

import type { Role } from "@prisma/client";

import { verifyDemo } from "@/lib/demo-token";
import { edgeAuth } from "@/server/auth/edge";

const DEMO_COOKIE = "tsa_demo";

// Path prefix -> required role.
const ROLE_BY_PREFIX: Array<{ prefix: string; role: Role }> = [
  { prefix: "/student", role: "STUDENT" },
  { prefix: "/coach", role: "COACH" },
  { prefix: "/parent", role: "PARENT" },
  { prefix: "/admin", role: "ADMIN" },
];

function requiredRole(pathname: string): Role | null {
  const match = ROLE_BY_PREFIX.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return match?.role ?? null;
}

export default edgeAuth(async (req) => {
  const { pathname } = req.nextUrl;
  const needed = requiredRole(pathname);
  if (!needed) return NextResponse.next();

  // 1) Demo session takes precedence.
  const demoToken = req.cookies.get(DEMO_COOKIE)?.value;
  if (demoToken) {
    const payload = await verifyDemo(demoToken, process.env.AUTH_SECRET ?? "");
    if (payload && payload.role === needed) return NextResponse.next();
    if (payload) {
      // Wrong role for this area — bounce to their own home.
      return NextResponse.redirect(new URL(`/${payload.role.toLowerCase()}`, req.url));
    }
  }

  // 2) Real Auth.js session (role decoded from the JWT).
  const role = req.auth?.user?.role;
  if (!role) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }
  if (role !== needed) {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/student/:path*", "/coach/:path*", "/parent/:path*", "/admin/:path*"],
};
