import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { meRouter } from "@/server/api/routers/me";
import { studentRouter } from "@/server/api/routers/student";
import { coachRouter } from "@/server/api/routers/coach";
import { parentRouter } from "@/server/api/routers/parent";
import { adminRouter } from "@/server/api/routers/admin";

export const appRouter = createTRPCRouter({
  me: meRouter,
  student: studentRouter,
  coach: coachRouter,
  parent: parentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
