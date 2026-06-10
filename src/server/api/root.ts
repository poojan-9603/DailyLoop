import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { meRouter } from "@/server/api/routers/me";

export const appRouter = createTRPCRouter({
  me: meRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
