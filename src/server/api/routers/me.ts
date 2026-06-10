import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

/** Minimal Phase 1 router: returns the current session user. */
export const meRouter = createTRPCRouter({
  current: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
