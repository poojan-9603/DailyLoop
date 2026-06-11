import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, parentProcedure } from "@/server/api/trpc";

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const parentRouter = createTRPCRouter({
  /** Children linked to this parent user. */
  myChildren: parentProcedure.query(async ({ ctx }) => {
    const links = await ctx.db.parentStudent.findMany({
      where: { parentUserId: ctx.user.id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });
    return links.map((l) => ({
      id: l.student.id,
      name: l.student.user.name ?? "Student",
    }));
  }),

  /** A child's day summary: study completion + training sessions. */
  childDay: parentProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify this parent can see this student
      const link = await ctx.db.parentStudent.findUnique({
        where: { parentUserId_studentId: { parentUserId: ctx.user.id, studentId: input.studentId } },
      });
      if (!link) throw new TRPCError({ code: "FORBIDDEN" });

      const today = todayDate();

      const plan = await ctx.db.studyPlan.findUnique({
        where: { studentId_date: { studentId: input.studentId, date: today } },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: { subject: { select: { name: true } } },
          },
        },
      });

      const sessions = await ctx.db.trainingSession.findMany({
        where: { studentId: input.studentId, date: today },
        include: { coach: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "asc" },
      });

      const total = plan?.tasks.length ?? 0;
      const done = plan?.tasks.filter((t) => t.completed).length ?? 0;
      const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        date: today.toISOString().split("T")[0]!,
        completionPct,
        totalTasks: total,
        completedTasks: done,
        tasks: plan?.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subject: t.subject.name,
          completed: t.completed,
          plannedMinutes: t.plannedMinutes,
        })) ?? [],
        sessions: sessions.map((s) => ({
          id: s.id,
          drill: s.drill,
          value: s.value,
          unit: s.unit,
          notes: s.notes,
          coach: s.coach.user.name ?? "Coach",
        })),
      };
    }),

  /** Recent digests for a child. */
  recentDigests: parentProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.parentStudent.findUnique({
        where: { parentUserId_studentId: { parentUserId: ctx.user.id, studentId: input.studentId } },
      });
      if (!link) throw new TRPCError({ code: "FORBIDDEN" });

      const digests = await ctx.db.digest.findMany({
        where: { studentId: input.studentId },
        orderBy: { date: "desc" },
        take: 7,
      });

      return digests.map((d) => ({
        id: d.id,
        date: d.date.toISOString().split("T")[0]!,
        content: d.content,
        emailedAt: d.emailedAt,
        openedAt: d.openedAt,
      }));
    }),
});
