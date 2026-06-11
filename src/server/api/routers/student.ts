import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, studentProcedure } from "@/server/api/trpc";
import { audit } from "@/server/audit";
import { PROMPT_VERSION } from "@/ai/prompts/plan";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function requireStudent(db: typeof import("@/server/db").db, userId: string) {
  const student = await db.student.findUnique({ where: { userId } });
  if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Student record not found." });
  return student;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const studentRouter = createTRPCRouter({
  /** Return today's plan with tasks (null if not generated yet). */
  todayPlan: studentProcedure.query(async ({ ctx }) => {
    const student = await requireStudent(ctx.db, ctx.user.id);
    const plan = await ctx.db.studyPlan.findUnique({
      where: { studentId_date: { studentId: student.id, date: todayDate() } },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
          include: { subject: { select: { name: true } } },
        },
      },
    });
    return plan;
  }),

  /** Persist the AI-streamed plan after the stream completes. */
  persistPlan: studentProcedure
    .input(
      z.object({
        tasks: z.array(
          z.object({
            subjectId: z.string(),
            subjectName: z.string(),
            title: z.string(),
            plannedMinutes: z.number().int().min(1),
            reason: z.string(),
          }),
        ),
        aiModel: z.string().default("claude-sonnet-4-20250514"),
        promptVersion: z.string().default(PROMPT_VERSION),
        isFallback: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const student = await requireStudent(ctx.db, ctx.user.id);
      const today = todayDate();

      // Idempotent: delete existing plan for today if re-generating
      await ctx.db.studyPlan.deleteMany({
        where: { studentId: student.id, date: today },
      });

      const totalMinutes = input.tasks.reduce((s, t) => s + t.plannedMinutes, 0);

      const plan = await ctx.db.studyPlan.create({
        data: {
          studentId: student.id,
          date: today,
          totalMinutes,
          aiModel: input.isFallback ? null : input.aiModel,
          promptVersion: input.isFallback ? null : input.promptVersion,
          tasks: {
            create: input.tasks.map((t, i) => ({
              subjectId: t.subjectId,
              title: t.title,
              plannedMinutes: t.plannedMinutes,
              reason: t.reason,
              sortOrder: i,
            })),
          },
        },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: { subject: { select: { name: true } } },
          },
        },
      });

      await audit(ctx.user.id, "plan_generated", "StudyPlan", plan.id);
      return plan;
    }),

  /**
   * Build a fallback plan from yesterday's structure.
   * Called when AI fails. Returns the new plan (or a synthetic default).
   */
  fallbackPlan: studentProcedure.mutation(async ({ ctx }) => {
    const student = await requireStudent(ctx.db, ctx.user.id);
    const today = todayDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const prior = await ctx.db.studyPlan.findUnique({
      where: { studentId_date: { studentId: student.id, date: yesterday } },
      include: {
        tasks: { orderBy: { sortOrder: "asc" }, include: { subject: true } },
      },
    });

    // Delete any partial today plan
    await ctx.db.studyPlan.deleteMany({ where: { studentId: student.id, date: today } });

    let tasks: Array<{
      subjectId: string;
      title: string;
      plannedMinutes: number;
      reason: string;
    }>;

    if (prior && prior.tasks.length > 0) {
      tasks = prior.tasks.map((t) => ({
        subjectId: t.subjectId,
        title: t.title,
        plannedMinutes: t.plannedMinutes,
        reason: "Carried forward from yesterday's plan.",
      }));
    } else {
      // No history: fetch subjects and build a generic 2-hour plan
      const subjects = await ctx.db.subject.findMany({
        where: { gradeLevel: student.gradeLevel },
        take: 4,
      });
      if (subjects.length === 0)
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No subjects configured." });
      const minutesEach = Math.floor(120 / subjects.length);
      tasks = subjects.map((s) => ({
        subjectId: s.id,
        title: `Review ${s.name} notes`,
        plannedMinutes: minutesEach,
        reason: "Default plan — AI is temporarily unavailable.",
      }));
    }

    const totalMinutes = tasks.reduce((s, t) => s + t.plannedMinutes, 0);
    const plan = await ctx.db.studyPlan.create({
      data: {
        studentId: student.id,
        date: today,
        totalMinutes,
        tasks: {
          create: tasks.map((t, i) => ({ ...t, sortOrder: i })),
        },
      },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
          include: { subject: { select: { name: true } } },
        },
      },
    });

    await audit(ctx.user.id, "plan_fallback", "StudyPlan", plan.id);
    return plan;
  }),

  /** Toggle task completion with optimistic UI support. */
  completeTask: studentProcedure
    .input(
      z.object({
        taskId: z.string(),
        completed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task belongs to this student
      const task = await ctx.db.studyTask.findUnique({
        where: { id: input.taskId },
        include: { plan: { select: { studentId: true } } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      const student = await requireStudent(ctx.db, ctx.user.id);
      if (task.plan.studentId !== student.id) throw new TRPCError({ code: "FORBIDDEN" });

      const updated = await ctx.db.studyTask.update({
        where: { id: input.taskId },
        data: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
      });

      await audit(ctx.user.id, input.completed ? "task_completed" : "task_uncompleted", "StudyTask", input.taskId);
      return updated;
    }),

  /** Update actual minutes after timer stops. */
  updateActualMinutes: studentProcedure
    .input(z.object({ taskId: z.string(), actualMinutes: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.studyTask.findUnique({
        where: { id: input.taskId },
        include: { plan: { select: { studentId: true } } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      const student = await requireStudent(ctx.db, ctx.user.id);
      if (task.plan.studentId !== student.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.studyTask.update({
        where: { id: input.taskId },
        data: { actualMinutes: input.actualMinutes },
      });
    }),

  /** Today's training sessions for the "afternoon flip" view. */
  todayTraining: studentProcedure.query(async ({ ctx }) => {
    const student = await requireStudent(ctx.db, ctx.user.id);
    const today = todayDate();
    const sessions = await ctx.db.trainingSession.findMany({
      where: { studentId: student.id, date: today },
      include: { coach: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return sessions;
  }),

  /** 7-day completion bars + per-subject stats for the Week sub-view. */
  weekData: studentProcedure.query(async ({ ctx }) => {
    const student = await requireStudent(ctx.db, ctx.user.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const plans = await ctx.db.studyPlan.findMany({
      where: { studentId: student.id, date: { gte: sevenDaysAgo } },
      include: {
        tasks: { include: { subject: { select: { name: true } } } },
      },
      orderBy: { date: "asc" },
    });

    // Daily bars
    const days = plans.map((plan) => {
      const total = plan.tasks.length;
      const done = plan.tasks.filter((t) => t.completed).length;
      return {
        date: plan.date.toISOString().split("T")[0]!,
        completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
        totalTasks: total,
        completedTasks: done,
      };
    });

    // Per-subject completion
    type SubAgg = { name: string; total: number; done: number };
    const subjectMap = new Map<string, SubAgg>();
    for (const plan of plans) {
      for (const task of plan.tasks) {
        const cur = subjectMap.get(task.subjectId) ?? {
          name: task.subject.name,
          total: 0,
          done: 0,
        };
        cur.total++;
        if (task.completed) cur.done++;
        subjectMap.set(task.subjectId, cur);
      }
    }

    const subjects = [...subjectMap.values()].map((s) => ({
      name: s.name,
      completionPct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    }));

    return { days, subjects };
  }),
});
