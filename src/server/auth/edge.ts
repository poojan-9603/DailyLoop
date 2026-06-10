import NextAuth from "next-auth";

import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js instance for MIDDLEWARE ONLY.
 *
 * The full config (config.ts) imports the Prisma adapter, which cannot run on the
 * edge runtime. Middleware only needs to DECODE the existing JWT (no DB), so this
 * instance omits the adapter and any DB-touching callbacks. Role was embedded in
 * the token at sign-in by the full config's jwt callback.
 */
export const { auth: edgeAuth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  trustHost: true,
});
