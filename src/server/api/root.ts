import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { meRouter } from "@/server/api/routers/me";
import { studentRouter } from "@/server/api/routers/student";

export const appRouter = createTRPCRouter({
  me: meRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
