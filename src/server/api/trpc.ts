import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Role } from "@prisma/client";

import { db } from "@/server/db";
import { getSessionUser, type SessionUser } from "@/server/auth/session";

/**
 * tRPC context: db handle + the resolved session user (real or demo).
 */
export async function createTRPCContext(opts: { headers: Headers }) {
  const user = await getSessionUser();
  return { db, user, headers: opts.headers };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** Requires any authenticated user (real or demo). */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user as SessionUser } });
});

/** Defense-in-depth: role-checked procedure factory mirroring middleware RBAC. */
export function roleProcedure(...roles: Role[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Wrong role for this action." });
    }
    return next({ ctx });
  });
}

export const studentProcedure = roleProcedure("STUDENT");
export const coachProcedure = roleProcedure("COACH");
export const parentProcedure = roleProcedure("PARENT");
export const adminProcedure = roleProcedure("ADMIN");
