import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/env";
import { audit } from "@/server/audit";
import { db } from "@/server/db";

// Only register Google when credentials are present. In placeholder mode the
// app still boots and demo mode still works; the sign-in page shows a notice.
const providers = [];
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers,
  // JWT sessions so RBAC middleware can verify the session on the edge runtime
  // (a database session would require a Prisma query, which edge can't do).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    // Reject unknown emails: only emails seeded as Users may sign in. Returning a
    // path string redirects there instead of auto-creating a user.
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await db.user.findUnique({ where: { email: user.email } });
      if (!existing) return "/unknown-email";
      return true;
    },
    // Embed id + role in the JWT on sign-in so they are available in middleware.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  events: {
    // Audit real sign-ins (demo entry is audited separately in demo.ts).
    async signIn({ user }) {
      if (user?.id) await audit(user.id, "auth.signin", "User", user.id);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
